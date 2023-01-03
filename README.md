# Align Bicep
Based on https://github.com/OldStarchy/Align-Spaces

Aligns certain operators by visually stretching the leading characters, this way you can have groups of aligned code, without having to deal with meaningless whitespace changes in your commits.

> Got a suggestion or issue? [Raise an issue on GitHub](https://github.com/aNickzz/Align-Spaces/issues/new)

<!--  -->

> Workspace Trust Support ✔

The default keybinding to toggle alignment is `ctrl` + `shift` + `=`.  
The default keybinding to trigger manual alignment is `ctrl` + `shift` + `\`.

## Config

Set `"align-bicep.delay"` to a number to wait a number of milliseconds before realigning on typing / document change, or set it to "off" and use the `align-bicep.realign` command to realign.

## Features

```bicep
// Aligns parameters:
param location string
param name string = uniqueString(resourceGroup().id)
param resourceGroupName string = resourceGroup().name
param subnetID string = ''
param enableVNET bool = false
param isZoneRedundant bool = false
param storageAccountType string = isZoneRedundant ? 'Standard_ZRS' : 'Standard_LRS'

// Aligns Nested Values 

var networkAcls = enableVNET ? {
  defaultAction: 'Deny'
  virtualNetworkRules: [
    {
      action: 'Allow'
      id: subnetID
    }
  ]
} : {}

// Format Output
output id string = newOrExisting == 'new' ? newStorageAccount.id : storageAccount.id
output blobStorageConnectionString string = blobStorageConnectionString
```

Will appear visually as

<!-- prettier-ignore -->
```bicep
param location 			 string
param name 				 string = uniqueString(resourceGroup().id)
param resourceGroupName  string = resourceGroup().name
param subnetID 		 	 string = ''
param enableVNET 		   bool = false
param isZoneRedundant 	   bool = false
param storageAccountType string = isZoneRedundant ? 'Standard_ZRS' : 'Standard_LRS'

// Aligns Nested Values 

var networkAcls = enableVNET ? {
  defaultAction      : 'Deny'
  virtualNetworkRules: [
    {
      action: 'Allow'
      id    : subnetID
    }
  ]
} : {}

// Format Output
output id                          string = newOrExisting == 'new' ? newStorageAccount.id : storageAccount.id
output blobStorageConnectionString string = blobStorageConnectionString
```

This works by adjusting the width of the character.
The source file is not changed, nor are extra characters shown in the browser (so auto-format will not try to undo the formatting).

## Known Issues

-   Rectangular selections are borked

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md)
