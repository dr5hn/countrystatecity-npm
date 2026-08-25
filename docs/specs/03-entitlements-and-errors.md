# Task 03: Keep Plans and Feature Access in One Place

**Status:** Ready to start  
**Main owner:** API and billing developer

## What this task is

Store plan names, limits, prices, and allowed features in one place. Make the API return clear messages when a user needs a higher plan or has used all requests.

## Problem it solves

Plan information is repeated in the API, CLI, dashboard, website, and documentation. These copies can become different. Customers also need to know whether a request failed because the feature is not included or because the request limit is finished.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` plans, limits, feature checks; `web/` dashboard plan display |
| [`dr5hn/csc-website-v2`](https://github.com/dr5hn/csc-website-v2) | Pricing page |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Plan and error documentation |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | SDK and CLI must read plan information instead of keeping their own copy |

## What to build

- One main plan list for Community, Starter, Supporter, Professional, and Business.
- Store the daily limit, monthly limit, price, and features for each plan.
- Add an API route that safely returns public plan information.
- Use the same plan list for API feature checks.
- Return `403` when the plan does not include a feature.
- Return `429` when the user has used all allowed requests.

A `403` message must say:

- Which feature was requested.
- The current plan.
- The required plan.
- The pricing page link.

A `429` message must say:

- Which limit was reached.
- The limit amount.
- When the limit resets.

## Important rules

- Do not show payment-provider IDs or private customer rules in the public plan route.
- Existing paid customers must keep the access they already bought.
- API key problems, feature problems, and limit problems must have different messages.

## Work steps

1. Find every place where plan information is copied.
2. Create one main plan list in the API.
3. Update API feature checks to use it.
4. Add the public plan route.
5. Update the dashboard, website, docs, SDK, and CLI to use the same information.
6. Add tests for all plans and features.

## Simple tests

- Test every paid feature with every plan.
- Confirm `403` is used for a missing feature.
- Confirm `429` is used for a finished request limit.
- Confirm old paid customers keep their access.
- Change one limit and confirm all product pages show the new value.

## Done when

- A plan change is made only once.
- All products show the same plans and limits.
- Error messages clearly tell customers what to do next.
- No private billing data is made public.

## Not included

- Changing the payment provider.
- Changing the approved prices or plan strategy.

