import { CFEntitySchema } from '../../../cloud-foundry/src/cf-entity-factory';
import { StratosCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { RecursiveDelete } from '../effects/recursive-entity-delete.effect';
import { EntitySchemaTreeBuilder } from './schema-tree-traverse';

// TODO: RC

describe('SchemaTreeTraversal', () => {
  let entitySchemaTreeBuilder: EntitySchemaTreeBuilder;
  const parentKey = 'parentKey';
  const childKey = 'childKey1';
  const grandChildKey = 'grandChild1';
  const greatGrandChildKey = 'greatGrandChild1';

  function generateEntityConfig(schema: EntitySchema, excludes: string[] = []): StratosCatalogueEntity {
    return new StratosCatalogueEntity(
      {
        type: schema.entityType,
        schema: {
          default: schema,
        },
        label: 'Space',
        labelPlural: 'Spaces',
        endpoint: {
          authTypes: [],
          logoUrl: '',
        },
        recursiveDelete: {
          excludes,
        }
      },
      {
        actionBuilders: null,
        dataReducers: [],
        entityBuilder: {
          getGuid: a => a.name,
          getMetadata: a => a
        }
      }
    );
  }


  beforeEach(() => {
    entitySchemaTreeBuilder = new EntitySchemaTreeBuilder();
  });

  it('should get tree with no arrays', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';

    const grandChildSchema = new CFEntitySchema(grandChildKey);
    const childSchema = new CFEntitySchema(childKey, {
      [grandChildSchema.entityType]: grandChildSchema
    });
    const parentSchema = new CFEntitySchema(parentKey, {
      [childSchema.entityType]: childSchema
    });

    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          [grandChildSchema.entityType]: grandchildId
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId
        }
      }
    };
<<<<<<< HEAD
    const action = new RecursiveDelete(parentId, null, generateEntityConfig(parentSchema));
=======
    const action = new RecursiveDelete(parentId, parentSchema);
>>>>>>> origin/v3-master
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [childSchema.key]: new Set([
        childId
      ]),
      [grandChildSchema.key]: new Set([
        grandchildId
      ])
    });
  });

  it('should get tree with array 1', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const grandChildSchema = new CFEntitySchema(grandChildKey);
    const childSchema = new CFEntitySchema(childKey, {
      [grandChildSchema.entityType]: [grandChildSchema]
    });
    const parentSchema = new CFEntitySchema(parentKey, {
      [childSchema.entityType]: childSchema
    });
    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          [grandChildSchema.entityType]: [grandchildId, grandchildId, grandchild2Id]
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId
        },
        [grandchild2Id]: {
          id: grandchild2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, null, generateEntityConfig(parentSchema));
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [childSchema.key]: new Set([
        childId
      ]),
      [grandChildSchema.key]: new Set([
        grandchildId,
        grandchild2Id
      ])
    });
  });

  it('should get tree with array 2', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const greatGrandChildSchema = new CFEntitySchema(greatGrandChildKey);
    const grandChildSchema = new CFEntitySchema(grandChildKey, {
      [greatGrandChildSchema.entityType]: [greatGrandChildSchema]
    });
    const childSchema = new CFEntitySchema(childKey, {
      [grandChildSchema.entityType]: [grandChildSchema]
    });
    const parentSchema = new CFEntitySchema(parentKey, {
      [childSchema.entityType]: childSchema
    });
    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          [grandChildSchema.entityType]: [grandchildId, grandchild2Id]
        },
        [child2Id]: {
          id: child2Id,
          [grandChildSchema.entityType]: [grandchildId, grandchild2Id]
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId,
          [greatGrandChildSchema.entityType]: [childId, 'unknown']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [greatGrandChildSchema.entityType]: [childId, child2Id]
        }
      },
      [greatGrandChildSchema.key]: {
        [childId]: {
          id: childId
        },
        [child2Id]: {
          id: child2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, null, generateEntityConfig(parentSchema));
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [childSchema.key]: new Set([
        childId
      ]),
      [grandChildSchema.key]: new Set([
        grandchildId,
        grandchild2Id
      ]),
      [greatGrandChildSchema.key]: new Set([
        childId,
        child2Id
      ])
    });
  });

  it('should get tree with object', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
<<<<<<< HEAD
    const greatGrandChildSchema = new EntitySchema(greatGrandChildKey, '');
    const grandChildSchema = new EntitySchema(grandChildKey, '', {
=======
    const greatGrandChildSchema = new CFEntitySchema(greatGrandChildKey);
    const grandChildSchema = new CFEntitySchema(grandChildKey, {
>>>>>>> origin/v3-master
      [greatGrandChildSchema.entityType]: [greatGrandChildSchema]
    });
    const childSchema = new CFEntitySchema(childKey, {
      entity: {
        [grandChildSchema.entityType]: [grandChildSchema]
      }
    });
    const parentSchema = new CFEntitySchema(parentKey, {
      [childSchema.entityType]: childSchema
    });
    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childKey]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        },
        [child2Id]: {
          id: child2Id,
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId,
          [greatGrandChildSchema.entityType]: [childId, 'unknown']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [greatGrandChildSchema.entityType]: [childId, child2Id]
        }
      },
      [greatGrandChildSchema.key]: {
        [childId]: {
          id: childId
        },
        [child2Id]: {
          id: child2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, null, generateEntityConfig(parentSchema));
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [childSchema.key]: new Set([
        childId
      ]),
      [grandChildSchema.key]: new Set([
        grandchildId,
        grandchild2Id
      ]),
      [greatGrandChildSchema.key]: new Set([
        childId,
        child2Id
      ])
    });
  });

  it('should exclude entity', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const greatGrandChildSchema = new CFEntitySchema(greatGrandChildKey);
    const grandChildSchema = new CFEntitySchema(grandChildKey, {
      [greatGrandChildSchema.entityType]: [greatGrandChildSchema]
    });
    const childSchema = new CFEntitySchema(childKey, {
      entity: {
        [grandChildSchema.entityType]: [grandChildSchema]
      }
    });
    const parentSchema = new CFEntitySchema(parentKey, {
      [childSchema.entityType]: childSchema
    });

    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        },
        NOPE: {
          id: 'NOPE',
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId,
          [greatGrandChildSchema.entityType]: ['NOPE']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [greatGrandChildSchema.entityType]: [childId, child2Id]
        }
      },
      [greatGrandChildSchema.key]: {
        [childId]: {
          id: childId
        },
        [child2Id]: {
          id: child2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, null, generateEntityConfig(parentSchema, [
      grandChildSchema.key
    ]));
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [childSchema.key]: new Set([
        childId
      ])
    });
  });
});
