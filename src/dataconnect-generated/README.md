# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*AllApps*](#allapps)
  - [*AppDetails*](#appdetails)
- [**Mutations**](#mutations)
  - [*CreateApp*](#createapp)
  - [*AddFeatureToApp*](#addfeaturetoapp)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## AllApps
You can execute the `AllApps` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
allApps(): QueryPromise<AllAppsData, undefined>;

interface AllAppsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AllAppsData, undefined>;
}
export const allAppsRef: AllAppsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
allApps(dc: DataConnect): QueryPromise<AllAppsData, undefined>;

interface AllAppsRef {
  ...
  (dc: DataConnect): QueryRef<AllAppsData, undefined>;
}
export const allAppsRef: AllAppsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the allAppsRef:
```typescript
const name = allAppsRef.operationName;
console.log(name);
```

### Variables
The `AllApps` query has no variables.
### Return Type
Recall that executing the `AllApps` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AllAppsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AllAppsData {
  apps: ({
    id: UUIDString;
    name: string;
    description: string;
  } & App_Key)[];
}
```
### Using `AllApps`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, allApps } from '@dataconnect/generated';


// Call the `allApps()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await allApps();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await allApps(dataConnect);

console.log(data.apps);

// Or, you can use the `Promise` API.
allApps().then((response) => {
  const data = response.data;
  console.log(data.apps);
});
```

### Using `AllApps`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, allAppsRef } from '@dataconnect/generated';


// Call the `allAppsRef()` function to get a reference to the query.
const ref = allAppsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = allAppsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.apps);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.apps);
});
```

## AppDetails
You can execute the `AppDetails` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
appDetails(vars: AppDetailsVariables): QueryPromise<AppDetailsData, AppDetailsVariables>;

interface AppDetailsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AppDetailsVariables): QueryRef<AppDetailsData, AppDetailsVariables>;
}
export const appDetailsRef: AppDetailsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
appDetails(dc: DataConnect, vars: AppDetailsVariables): QueryPromise<AppDetailsData, AppDetailsVariables>;

interface AppDetailsRef {
  ...
  (dc: DataConnect, vars: AppDetailsVariables): QueryRef<AppDetailsData, AppDetailsVariables>;
}
export const appDetailsRef: AppDetailsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the appDetailsRef:
```typescript
const name = appDetailsRef.operationName;
console.log(name);
```

### Variables
The `AppDetails` query requires an argument of type `AppDetailsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AppDetailsVariables {
  appId: UUIDString;
}
```
### Return Type
Recall that executing the `AppDetails` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AppDetailsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AppDetailsData {
  app?: {
    id: UUIDString;
    name: string;
    description: string;
    features_on_app: ({
      id: UUIDString;
      name: string;
      description: string;
    } & Feature_Key)[];
      audiences_via_AppAudience: ({
        id: UUIDString;
        name: string;
        description: string;
      } & Audience_Key)[];
  } & App_Key;
}
```
### Using `AppDetails`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, appDetails, AppDetailsVariables } from '@dataconnect/generated';

// The `AppDetails` query requires an argument of type `AppDetailsVariables`:
const appDetailsVars: AppDetailsVariables = {
  appId: ..., 
};

// Call the `appDetails()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await appDetails(appDetailsVars);
// Variables can be defined inline as well.
const { data } = await appDetails({ appId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await appDetails(dataConnect, appDetailsVars);

console.log(data.app);

// Or, you can use the `Promise` API.
appDetails(appDetailsVars).then((response) => {
  const data = response.data;
  console.log(data.app);
});
```

### Using `AppDetails`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, appDetailsRef, AppDetailsVariables } from '@dataconnect/generated';

// The `AppDetails` query requires an argument of type `AppDetailsVariables`:
const appDetailsVars: AppDetailsVariables = {
  appId: ..., 
};

// Call the `appDetailsRef()` function to get a reference to the query.
const ref = appDetailsRef(appDetailsVars);
// Variables can be defined inline as well.
const ref = appDetailsRef({ appId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = appDetailsRef(dataConnect, appDetailsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.app);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.app);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateApp
You can execute the `CreateApp` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createApp(vars: CreateAppVariables): MutationPromise<CreateAppData, CreateAppVariables>;

interface CreateAppRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAppVariables): MutationRef<CreateAppData, CreateAppVariables>;
}
export const createAppRef: CreateAppRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createApp(dc: DataConnect, vars: CreateAppVariables): MutationPromise<CreateAppData, CreateAppVariables>;

interface CreateAppRef {
  ...
  (dc: DataConnect, vars: CreateAppVariables): MutationRef<CreateAppData, CreateAppVariables>;
}
export const createAppRef: CreateAppRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createAppRef:
```typescript
const name = createAppRef.operationName;
console.log(name);
```

### Variables
The `CreateApp` mutation requires an argument of type `CreateAppVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateAppVariables {
  name: string;
  description: string;
}
```
### Return Type
Recall that executing the `CreateApp` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateAppData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateAppData {
  app_insert: App_Key;
}
```
### Using `CreateApp`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createApp, CreateAppVariables } from '@dataconnect/generated';

// The `CreateApp` mutation requires an argument of type `CreateAppVariables`:
const createAppVars: CreateAppVariables = {
  name: ..., 
  description: ..., 
};

// Call the `createApp()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createApp(createAppVars);
// Variables can be defined inline as well.
const { data } = await createApp({ name: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createApp(dataConnect, createAppVars);

console.log(data.app_insert);

// Or, you can use the `Promise` API.
createApp(createAppVars).then((response) => {
  const data = response.data;
  console.log(data.app_insert);
});
```

### Using `CreateApp`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createAppRef, CreateAppVariables } from '@dataconnect/generated';

// The `CreateApp` mutation requires an argument of type `CreateAppVariables`:
const createAppVars: CreateAppVariables = {
  name: ..., 
  description: ..., 
};

// Call the `createAppRef()` function to get a reference to the mutation.
const ref = createAppRef(createAppVars);
// Variables can be defined inline as well.
const ref = createAppRef({ name: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createAppRef(dataConnect, createAppVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.app_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.app_insert);
});
```

## AddFeatureToApp
You can execute the `AddFeatureToApp` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addFeatureToApp(vars: AddFeatureToAppVariables): MutationPromise<AddFeatureToAppData, AddFeatureToAppVariables>;

interface AddFeatureToAppRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddFeatureToAppVariables): MutationRef<AddFeatureToAppData, AddFeatureToAppVariables>;
}
export const addFeatureToAppRef: AddFeatureToAppRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addFeatureToApp(dc: DataConnect, vars: AddFeatureToAppVariables): MutationPromise<AddFeatureToAppData, AddFeatureToAppVariables>;

interface AddFeatureToAppRef {
  ...
  (dc: DataConnect, vars: AddFeatureToAppVariables): MutationRef<AddFeatureToAppData, AddFeatureToAppVariables>;
}
export const addFeatureToAppRef: AddFeatureToAppRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addFeatureToAppRef:
```typescript
const name = addFeatureToAppRef.operationName;
console.log(name);
```

### Variables
The `AddFeatureToApp` mutation requires an argument of type `AddFeatureToAppVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddFeatureToAppVariables {
  appId: UUIDString;
  featureName: string;
  featureDescription: string;
}
```
### Return Type
Recall that executing the `AddFeatureToApp` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddFeatureToAppData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddFeatureToAppData {
  feature_insert: Feature_Key;
}
```
### Using `AddFeatureToApp`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addFeatureToApp, AddFeatureToAppVariables } from '@dataconnect/generated';

// The `AddFeatureToApp` mutation requires an argument of type `AddFeatureToAppVariables`:
const addFeatureToAppVars: AddFeatureToAppVariables = {
  appId: ..., 
  featureName: ..., 
  featureDescription: ..., 
};

// Call the `addFeatureToApp()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addFeatureToApp(addFeatureToAppVars);
// Variables can be defined inline as well.
const { data } = await addFeatureToApp({ appId: ..., featureName: ..., featureDescription: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addFeatureToApp(dataConnect, addFeatureToAppVars);

console.log(data.feature_insert);

// Or, you can use the `Promise` API.
addFeatureToApp(addFeatureToAppVars).then((response) => {
  const data = response.data;
  console.log(data.feature_insert);
});
```

### Using `AddFeatureToApp`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addFeatureToAppRef, AddFeatureToAppVariables } from '@dataconnect/generated';

// The `AddFeatureToApp` mutation requires an argument of type `AddFeatureToAppVariables`:
const addFeatureToAppVars: AddFeatureToAppVariables = {
  appId: ..., 
  featureName: ..., 
  featureDescription: ..., 
};

// Call the `addFeatureToAppRef()` function to get a reference to the mutation.
const ref = addFeatureToAppRef(addFeatureToAppVars);
// Variables can be defined inline as well.
const ref = addFeatureToAppRef({ appId: ..., featureName: ..., featureDescription: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addFeatureToAppRef(dataConnect, addFeatureToAppVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.feature_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.feature_insert);
});
```

