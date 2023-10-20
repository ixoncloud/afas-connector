from datetime import datetime
import json
import base64
import requests

from ixoncdkingress.cbc.context import CbcContext
from typing import List, Dict, Union


# ------------------------------------
# Public functions
# ------------------------------------

@CbcContext.expose
def get_files(context: CbcContext) -> List[Dict[str, str]]:
    return _get_files_from_afas(context)


@CbcContext.expose
def download_file(context: CbcContext, file_id: str, file_name: str):
    zapier_webhook_url = context.config.get('zapier_webhook_url')

    if (zapier_webhook_url):
        now = datetime.now()
        iso_format = now.strftime("%Y-%m-%dT%H:%M:%S")
        requests.post(zapier_webhook_url,
                      data={'agent_or_asset': context.agent_or_asset.name,
                            'file_id': file_id, 'file_name': file_name,
                            'utc_time': iso_format})

    return _download_file_from_afas(context, file_id, file_name)


# ------------------------------------
# AFAS functions
# ------------------------------------

def _get_files_from_afas(context: CbcContext) -> List[Dict[str, str]]:
    error_conditions = _check_error_conditions(context)
    if error_conditions:
        return error_conditions

    token = context.config.get('token')
    environment_id = context.config.get('environment_id')
    dossier_per_project_connector = context.config.get(
        'dossier_per_project_connector')
    files_per_dossier_connector = context.config.get(
        'files_per_dossier_connector')

    project_id = context.config.get(
        'project_id_custom_field_id')
    project_id = context.agent_or_asset.custom_properties.get(
        project_id)

    afas_token = _get_encoded_afas_token(token)
    headers = {'Authorization': afas_token}

    url_dossier_per_project_connector = _build_connector_url(
        environment_id, dossier_per_project_connector)
    response = requests.get(url_dossier_per_project_connector, headers=headers)

    if response.status_code == 200:
        response = response.json()

        rows = response.get('rows')

        filtered_rows = _get_filtered_rows(
            rows, 'Project', project_id)
        dossier_items = [row.get('Dossieritem') for row in filtered_rows]

        url_files_per_dossier_connector = _build_connector_url(
            environment_id, files_per_dossier_connector)
        response = requests.get(
            url_files_per_dossier_connector, headers=headers)

        if response.status_code == 200:
            response = response.json()
            rows = response.get('rows')

            filtered_rows = _get_filtered_rows_in(
                rows, 'Dossieritem', dossier_items)
            files_list = _get_files_list(filtered_rows)
            return files_list

    return {'error': 'Something went wrong'}


def _download_file_from_afas(context: CbcContext, file_id: str, file_name: str) -> Dict[str, str]:
    error_conditions = _check_error_conditions(context)
    if error_conditions:
        return error_conditions

    token = context.config.get('token')
    environment_id = context.config.get('environment_id')

    afas_token = _get_encoded_afas_token(token)
    url = _build_afas_file_download_url(environment_id, file_id, file_name)

    headers = {'Authorization': afas_token}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        content = json.loads(response.content)
        file_name = content['filename']
        mime_type = content['mimetype']
        filedata_base64 = content['filedata']
        return {'file_name': file_name, 'pdf_file': f"data:{mime_type};base64,{filedata_base64}"}
    else:
        return {'error': 'Something went wrong'}

# ------------------------------------
# AFAS helper functions
# ------------------------------------


def _check_error_conditions(context: CbcContext) -> Union[List
                                                          [Dict[str, str]],
                                                          None]:
    token = context.config.get('token')
    if not token:
        return {'error': 'No token found'}

    environment_id = context.config.get('environment_id')
    if not environment_id:
        return {'error': 'No environment id found'}

    dossier_per_project_connector = context.config.get(
        'dossier_per_project_connector')
    if not dossier_per_project_connector:
        return {'error': 'No dossier_per_project_connector found'}

    files_per_dossier_connector = context.config.get(
        'files_per_dossier_connector')
    if not files_per_dossier_connector:
        return {'error': 'No files_per_dossier_connector found'}

    project_id = context.config.get(
        'project_id_custom_field_id')
    project_id = context.agent_or_asset.custom_properties.get(
        project_id)
    if not project_id:
        return {'error': 'No serial number found'}

    return None


def _get_encoded_afas_token(token: str) -> str:
    encoded_token = base64.b64encode(token.encode()).decode()
    return f"AfasToken {encoded_token}"


# https://help.afas.nl/help/NL/SE/App_Cnr_Rest_Api.htm#o106273
# Workaround for now default limit is 100 rows per request and we need all rows
# I think you will need an extreme amount of machines before a request timeout (max 15 minutes)
def _build_connector_url(environment_id: str, connector: str) -> str:
    return f"https://{environment_id}.rest.afas.online/ProfitRestServices/connectors/{connector}?skip=-1&take=-1"


def _build_afas_file_download_url(
        environment_id: str, file_id: str, file_name: str) -> str:
    # https://help.afas.nl/help/NL/SE/App_Cnr_Rest_FileCn.htm
    # Beware that comma's in the file name do not work in the url even when encoded, AFAS bug?
    url = f"https://{environment_id}.rest.afas.online/ProfitRestServices/fileconnector/{file_id}/{file_name}"
    return url


def _get_filtered_rows(rows: List[Dict[str, str]],
                       key: str, value: str) -> List[Dict[str, str]]:
    return [row for row in rows if row.get(key) == value]


def _get_filtered_rows_in(rows: List[Dict[str, str]],
                          key: str, values: List[str]) -> List[Dict[str, str]]:
    return [row for row in rows if row.get(key) in values]


def _get_files_list(filtered_rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    return [{'name': row.get('Naam'), 'id': row.get('Bijlage')} for row in filtered_rows]
