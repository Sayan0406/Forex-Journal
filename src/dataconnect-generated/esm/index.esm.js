import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'forex',
  location: 'us-east4'
};

export const allAppsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AllApps');
}
allAppsRef.operationName = 'AllApps';

export function allApps(dc) {
  return executeQuery(allAppsRef(dc));
}

export const appDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AppDetails', inputVars);
}
appDetailsRef.operationName = 'AppDetails';

export function appDetails(dcOrVars, vars) {
  return executeQuery(appDetailsRef(dcOrVars, vars));
}

export const createAppRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateApp', inputVars);
}
createAppRef.operationName = 'CreateApp';

export function createApp(dcOrVars, vars) {
  return executeMutation(createAppRef(dcOrVars, vars));
}

export const addFeatureToAppRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddFeatureToApp', inputVars);
}
addFeatureToAppRef.operationName = 'AddFeatureToApp';

export function addFeatureToApp(dcOrVars, vars) {
  return executeMutation(addFeatureToAppRef(dcOrVars, vars));
}

