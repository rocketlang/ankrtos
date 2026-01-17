# BFC API Documentation

## Overview

The BFC API is a GraphQL API built with Fastify and Mercurius. It provides all backend functionality for the banking platform.

**Endpoint:** `http://localhost:4020/graphql`

**Playground:** `http://localhost:4020/graphiql`

## Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

### Login

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      name
      role
    }
  }
}
```

### Roles

| Role | Access Level |
|------|-------------|
| CUSTOMER | Own data only |
| STAFF | Branch customers |
| BRANCH_MANAGER | Branch data, approvals |
| REGIONAL_MANAGER | Region data |
| COMPLIANCE_MANAGER | Compliance data |
| RISK_MANAGER | Risk data |
| ADMIN | All data |
| SUPER_ADMIN | Everything |

---

## Customer APIs

### Get Customer

```graphql
query Customer($id: ID!) {
  customer(id: $id) {
    id
    externalId
    name
    phone
    email
    kycStatus
    riskScore
    trustScore
    segment
    products {
      id
      productType
      accountNumber
      balance
      status
    }
    offers {
      id
      title
      confidence
      status
    }
  }
}
```

### Search Customers

```graphql
query SearchCustomers($query: String!, $limit: Int, $offset: Int) {
  searchCustomers(query: $query, limit: $limit, offset: $offset) {
    items {
      id
      name
      phone
      segment
      riskScore
    }
    total
    hasMore
  }
}
```

### Create Customer

```graphql
mutation CreateCustomer($input: CustomerInput!) {
  createCustomer(input: $input) {
    id
    externalId
    name
    kycStatus
  }
}
```

### Update Customer

```graphql
mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
  updateCustomer(id: $id, input: $input) {
    id
    name
    updatedAt
  }
}
```

### Get Customer Episodes

```graphql
query CustomerEpisodes($customerId: ID!, $limit: Int) {
  customerEpisodes(customerId: $customerId, limit: $limit) {
    id
    state
    action
    outcome
    success
    module
    channel
    createdAt
  }
}
```

---

## Credit Decisioning APIs

### Request Credit Decision

```graphql
mutation RequestCreditDecision($input: CreditInput!) {
  requestCreditDecision(input: $input) {
    applicationId
    decision
    approvedAmount
    approvedTenure
    interestRate
    processingFee
    emiAmount
    conditions
    rejectionReasons
    riskGrade
    riskScore
    defaultProbability
    policyChecks {
      policy
      passed
      value
      threshold
      message
    }
    aiConfidence
    aiReasoning
    similarCases {
      similarity
      outcome
      amount
    }
    processingTime
    decidedBy
  }
}
```

**Input:**

```graphql
input CreditInput {
  customerId: ID!
  productType: ProductType!
  applicant: ApplicantInput!
  financial: FinancialInput!
  request: LoanRequestInput!
  bureauScore: Int
}

input ApplicantInput {
  name: String!
  age: Int!
  occupation: String!
  employmentType: EmploymentType!
  employer: String
  yearsEmployed: Float
  residenceType: ResidenceType!
}

input FinancialInput {
  monthlyIncome: Float!
  additionalIncome: Float
  existingEmi: Float
}

input LoanRequestInput {
  amount: Float!
  tenure: Int!
  purpose: String
}
```

### Get Credit Policies

```graphql
query CreditPolicies($productType: ProductType) {
  creditPolicies(productType: $productType) {
    productType
    minAge
    maxAge
    minIncome
    maxLoanAmount
    maxFoir
    minBureauScore
    baseRate
  }
}
```

---

## Offer APIs

### Get Customer Offers

```graphql
query CustomerOffers($customerId: ID!, $status: OfferStatus) {
  customerOffers(customerId: $customerId, status: $status) {
    id
    offerType
    title
    description
    terms
    confidence
    relevanceScore
    status
    expiresAt
  }
}
```

### Generate Offers

```graphql
mutation GenerateOffers($customerId: ID!) {
  generateOffers(customerId: $customerId) {
    generated
    offers {
      id
      title
      confidence
    }
  }
}
```

### Update Offer Status

```graphql
mutation UpdateOfferStatus($id: ID!, $status: OfferStatus!) {
  updateOfferStatus(id: $id, status: $status) {
    id
    status
    clickedAt
    convertedAt
  }
}
```

---

## Notification APIs

### Send Notification

```graphql
mutation SendNotification(
  $recipientId: ID!
  $channel: NotificationChannel!
  $category: NotificationCategory!
  $title: String!
  $body: String!
) {
  sendNotification(
    recipientId: $recipientId
    channel: $channel
    category: $category
    title: $title
    body: $body
  ) {
    success
    notificationId
    error
  }
}
```

### Send Bulk Notification

```graphql
mutation SendBulkNotification(
  $templateId: ID!
  $recipientIds: [ID!]!
  $channel: NotificationChannel!
  $variables: JSON!
) {
  sendBulkNotification(
    templateId: $templateId
    recipientIds: $recipientIds
    channel: $channel
    variables: $variables
  ) {
    total
    sent
    failed
    errors
  }
}
```

### Get Notifications

```graphql
query Notifications($limit: Int, $category: NotificationCategory) {
  notifications(limit: $limit, category: $category) {
    items {
      id
      title
      body
      category
      priority
      status
      createdAt
    }
    total
    hasMore
  }
}
```

### Update Notification Preference

```graphql
mutation UpdateNotificationPreference(
  $channel: NotificationChannel!
  $category: NotificationCategory!
  $enabled: Boolean!
) {
  updateNotificationPreference(
    channel: $channel
    category: $category
    enabled: $enabled
  ) {
    userId
    channel
    category
    enabled
  }
}
```

---

## Compliance APIs

### Verify PAN

```graphql
mutation VerifyPAN($pan: String!, $name: String) {
  verifyPAN(pan: $pan, name: $name) {
    valid
    pan
    name
    status
    category
  }
}
```

### Verify Aadhaar

```graphql
mutation VerifyAadhaar($aadhaar: String!, $otp: String) {
  verifyAadhaar(aadhaar: $aadhaar, otp: $otp) {
    valid
    verified
    name
    address
  }
}
```

### Run AML Check

```graphql
mutation RunAMLCheck($customerId: ID!) {
  runAMLCheck(customerId: $customerId) {
    riskLevel
    riskScore
    flags {
      type
      severity
      description
    }
    pep
    sanctioned
    recommendation
  }
}
```

### Screen Transaction

```graphql
mutation ScreenTransaction($input: TransactionScreenInput!) {
  screenTransaction(input: $input) {
    flagged
    riskScore
    flags
    requiresReporting
    reportType
  }
}
```

---

## Subscriptions (WebSocket)

### Notification Subscription

```graphql
subscription NotificationReceived {
  notificationReceived {
    id
    title
    body
    category
    priority
    createdAt
  }
}
```

### Customer Update Subscription

```graphql
subscription CustomerUpdated($customerId: ID!) {
  customerUpdated(customerId: $customerId) {
    id
    riskScore
    trustScore
    lastActivityAt
  }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "extensions": {
        "code": "ERROR_CODE",
        "details": {}
      }
    }
  ]
}
```

### Error Codes

| Code | Description |
|------|-------------|
| UNAUTHENTICATED | Missing or invalid token |
| FORBIDDEN | Insufficient permissions |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Invalid input |
| RATE_LIMITED | Too many requests |
| INTERNAL_ERROR | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Queries | 100/min |
| Mutations | 50/min |
| Bulk Operations | 10/min |

---

## Pagination

All list queries support pagination:

```graphql
query {
  customers(limit: 20, offset: 0) {
    items { ... }
    total
    hasMore
  }
}
```
