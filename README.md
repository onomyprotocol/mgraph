# Build and deploy for onex-testnet-5

```bash
yarn install
yarn run prepare:onex-testnet-5
yarn run codegen
yarn run create-local
yarn run deploy-local
```

# Open GraphQL UI

http://0.0.0.0:8000/subgraphs/name/mgraph/graphql

# Playground example

Example:

Request:

```graphql
{
    orders(first: 10) {
        id
    }
}
```