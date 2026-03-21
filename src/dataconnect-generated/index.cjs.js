const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'forex',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const allAppsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AllApps');
}
allAppsRef.operationName = 'AllApps';
exports.allAppsRef = allAppsRef;

exports.allApps = function allApps(dc) {
  return executeQuery(allAppsRef(dc));
};

const appDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AppDetails', inputVars);
}
appDetailsRef.operationName = 'AppDetails';
exports.appDetailsRef = appDetailsRef;

exports.appDetails = function appDetails(dcOrVars, vars) {
  return executeQuery(appDetailsRef(dcOrVars, vars));
};

const createAppRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateApp', inputVars);
}
createAppRef.operationName = 'CreateApp';
exports.createAppRef = createAppRef;

exports.createApp = function createApp(dcOrVars, vars) {
  return executeMutation(createAppRef(dcOrVars, vars));
};

const addFeatureToAppRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddFeatureToApp', inputVars);
}
addFeatureToAppRef.operationName = 'AddFeatureToApp';
exports.addFeatureToAppRef = addFeatureToAppRef;

exports.addFeatureToApp = function addFeatureToApp(dcOrVars, vars) {
  return executeMutation(addFeatureToAppRef(dcOrVars, vars));
};
