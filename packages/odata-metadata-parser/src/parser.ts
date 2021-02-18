import {
  ODataMetadata,
  ODataEntitySet,
  ODataEntityType,
  ODataProperty,
  ODataTypeMap
} from './types';

export class ODataMetadataParser  {
  constructor() {
  }

  async parseODataMetadata(metadataUrl: string) {
    const res = await fetch(metadataUrl);
    const rawMetadata = await res.text();

    const parser = new DOMParser();
    const metadata = parser.parseFromString(rawMetadata, 'application/xml');

    const oDataMetadata = new ODataMetadata();

    metadata.querySelectorAll('Schema')
      .forEach((schema) => {
        const namespace: string = schema.getAttribute('Namespace') ?? '';
        const namespaceDot: string = namespace.length ? namespace + '.' : '';

        schema.querySelectorAll('EntityType')
          .forEach((entityType) => {
            const entityTypeName: string = entityType.getAttribute('Name') ?? '';
            const oDataEntityType = new ODataEntityType(entityTypeName, namespace);

            entityType.querySelectorAll('Property')
              .forEach((property) => {
                const propertyName: string = property.getAttribute('Name') ?? '';
                const oDataProperty = new ODataProperty(propertyName);

                for (const attribute of ODataProperty.labelAttributes) {
                  const value = property.getAttributeNS(attribute.namespace, attribute.name);
                  if (value) {
                    oDataProperty.label = value;
                    break;
                  }
                }

                oDataProperty.isNullable = !!property.getAttribute('Nullable');

                const propertyType: string = property.getAttribute('Type') ?? '';
                oDataProperty.type = ODataTypeMap[propertyType];
                oDataEntityType.properties.set(propertyName, oDataProperty);
              }, this);

            entityType.querySelectorAll('Key > PropertyRef')
              .forEach((propertyRef) => {
                const propertyName: string = propertyRef.getAttribute('Name') ?? '';
                if (oDataEntityType.properties.has(propertyName)) {
                  const property = oDataEntityType.properties.get(propertyName);
                  if (property) {
                    property.isKey = true;
                  }
                }
              }, this);

            oDataMetadata.entityTypes.set(namespaceDot + entityTypeName, oDataEntityType);
          }, this);
      }, this);

    metadata.querySelectorAll('Schema')
      .forEach((schema) => {
        const namespace: string = schema.getAttribute('Namespace') ?? '';
        const namespaceDot: string = namespace.length ? namespace + '.' : '';

        schema.querySelectorAll('EntitySet')
          .forEach((entitySet) => {
            const entitySetName: string = entitySet.getAttribute('Name') ?? '';
            const entityTypeString: string = entitySet.getAttribute('EntityType') ?? '';
            const oDataEntitySet = new ODataEntitySet(entitySetName, oDataMetadata.entityTypes.get(entityTypeString) ?? new ODataEntityType('INVALID: ' + entityTypeString), namespace);
            oDataMetadata.entitySets.set(namespaceDot + entitySetName, oDataEntitySet);
            oDataMetadata.entitySets.set(entitySetName, oDataEntitySet);
          }, this);
      }, this);
    return oDataMetadata;
  }
}