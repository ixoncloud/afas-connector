# AFAS Document Connector App

This workspace contains the AFAS Document Connector App for IXON Cloud. It can be used to present machine specific documentation per machine in the IXON Cloud. It is based on the [IXON Cloud Custom Component Development Kit](https://developer.ixon.cloud/docs/custom-components) and [IXON Cloud Backend Component Workspace](https://github.com/ixoncloud/backend-component-workspace). Note that this app is built with [Svelte](https://svelte.dev/), [Typescript](https://www.typescriptlang.org/), [SCSS](https://sass-lang.com/) and [Python](https://www.python.org/). It requires you to be familiar with the [Node.js](https://nodejs.org/) ecosystem.

## Testing locally

Install the dependencies...

```sh
npm install
```

...login to your IXON Cloud account...

```sh
npx cdk login
```

...and run the simulator:

```sh
npx cdk simulate calculate-single-value
```

...this opens the simulator app in a browser and builds the component in watch-mode, which means that any changes to the component source files will trigger a rebuild and will auto-reload the simulator.

To run the Cloud Functions call:

```sh
make run
```

...no additional commands are required, as this is automatically sets up your virtual environment and installs dependencies.

## Documentation

To check out docs and examples on how to develop an App, visit [Custom Component Development Docs](https://developer.ixon.cloud/docs/custom-components) and [Cloud Functions Development Docs](https://developer.ixon.cloud/docs/cloud-functions-introduction).

The [@ixon-cdk/runner](https://www.npmjs.com/package/@ixon-cdk/runner) page has a complete overview of all commands that can be run in a component workspace project.

## Context config

```json
{
  "token": "<token><version>1</version><data>token123</data></token>",
  "environment_id": "123456",
  "dossier_per_project_connector": "conn_1",
  "files_per_dossier_connector": "conn_2",
  "project_id_custom_field_id": "comSerialNo",
  "zapier_webhook_url": "https://hooks.zapier.com/hooks/catch/x/y/"
}
```

token is used to authenticate to afas: https://help.afas.nl/help/EN/SE/App_Cnr_Rest_Token.htm
environment_id is used to select the correct environment in afas
dossier_per_project_connector is used to get the dossier id for the project in afas
files_per_dossier_connector is used to get the files for the dossier in afas
project_id_custom_field_id is used to map the project in afas to the agent or asset in IXON Cloud
zapier_webhook_url is optional used for logging when the download button is clicked

example for dossier_per_project_connector response from afas:

```json
{
  'skip': -1,
  'take': -1,
  'rows': [
    {
      Project': '1-XXXX',
      'Type_dossieritem': 77,
      'Omschrijving':
      'Ixon dossieritem',
      'Instuurdatum': '2023-04-20T13:48:50Z',
      'Onderwerp': '1-XXXX Installation manual',
      'Dossieritem_bijlage': True,
      'Dossieritem': 80967
    }
  ]
}
```

the rows array is filtered on Project and Dossieritem afterwards

example for files_per_dossier_connector response from afas:

```json
{
  "skip": -1,
  "take": -1,
  "rows": [
    {
      "Bijlage-Id": 85458,
      "Dossieritem": 80967,
      "Bijlage": "B8C08F324E40328F9C8EC483AEAB44DE",
      "Naam": "1-XXXX Installation manual.pdf",
      "Bestandsgrootte": 3866,
      "Type_dossieritem": 64,
      "Nummer": 2
    }
  ]
}
```

the rows array will be filtered on Dossieritem afterwards
