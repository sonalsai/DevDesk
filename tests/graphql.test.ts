import { describe, it, expect } from 'vitest';
import { buildQueryForField, STANDARD_INTROSPECTION_QUERY } from '../src/services/graphqlExecutor';
import type { GraphQLSchemaField, GraphQLSchemaType } from '../src/types/api';

describe('Unit Test: GraphQL Query Builder & Introspection Utilities', () => {
  it('buildQueryForField generates formatted selection for object types', () => {
    const field: GraphQLSchemaField = {
      name: 'users',
      type: '[User]!',
      args: [],
    };

    const schemaTypes: GraphQLSchemaType[] = [
      {
        name: 'User',
        kind: 'OBJECT',
        fields: [
          { name: 'id', type: 'ID!', args: [] },
          { name: 'username', type: 'String!', args: [] },
          { name: 'email', type: 'String', args: [] },
        ],
      },
    ];

    const result = buildQueryForField(field, schemaTypes);
    expect(result).toContain('users {');
    expect(result).toContain('id');
    expect(result).toContain('username');
  });

  it('buildQueryForField returns scalar field name directly without nested braces', () => {
    const scalarField: GraphQLSchemaField = {
      name: 'healthCheck',
      type: 'Boolean',
      args: [],
    };

    const result = buildQueryForField(scalarField, []);
    expect(result).toBe('healthCheck');
  });

  it('standard introspection query requests __schema types and fields', () => {
    expect(STANDARD_INTROSPECTION_QUERY).toContain('__schema');
    expect(STANDARD_INTROSPECTION_QUERY).toContain('queryType');
    expect(STANDARD_INTROSPECTION_QUERY).toContain('mutationType');
    expect(STANDARD_INTROSPECTION_QUERY).toContain('fields');
  });
});
