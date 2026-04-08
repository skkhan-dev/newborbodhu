# Borbodhu Permissions Matrix

## Roles

- guest
- member
- ghotok
- vendor
- admin
- super_admin

## Guest permissions

- browse public pages
- browse public SEO-safe profile pages
- browse public vendor pages
- browse public ghotok pages
- use public search entry points with limited results
- register
- login
- request password reset

## Member permissions

### Account and profile

- create account
- edit own profile
- upload profile media
- manage media privacy
- submit profile for review
- view own approval status
- view rejection reason
- change password
- manage language preference

### Discovery

- use quick search
- use advanced search
- use photo search
- save searches
- view recommendations
- view activity-based sort tabs

### Interaction

- send interest
- favorite profiles
- block profiles
- view profile visitors
- view interests received
- view favorites received if product exposes it
- request private photo access
- grant or deny private photo access

### Communication and commerce

- message according to plan permissions
- view contact according to plan permissions
- upgrade membership
- redeem coupon
- view payment history

### Wedding

- create wedding project
- manage guest list
- shortlist vendors
- send vendor inquiry

## Ghotok permissions

### Identity and account

- login
- manage own ghotok profile
- view wallet balance
- request more credit

### Member management

- create member profiles on behalf of clients
- edit managed member profiles
- upload managed member media
- view approval status of managed members
- search matches for managed members
- send interests for managed members
- manage communication for managed members based on product rules

### Impersonation

- start impersonation of linked member
- stop impersonation
- spend credit when viewing contact or taking configured actions
- view credit history

### Wedding and vendor

- help managed members shortlist vendors
- send vendor inquiries for managed members if allowed

## Vendor permissions

### Account and listing

- register vendor account
- edit vendor profile
- manage categories
- manage gallery
- manage packages
- update business contact info

### Leads and billing

- view leads
- update lead status
- respond to inquiry through approved channels
- view billing status
- view invoices or charges when billing is implemented

## Admin permissions

### Moderation

- view pending member profiles
- approve member profiles
- reject member profiles with notes
- edit submitted profiles before activation
- approve or reject photos
- view cancellation requests
- cancel profile permanently
- delete invalid profile

### Operations

- assign or update memberships
- record manual payments
- approve office payments
- upgrade memberships
- create coupons
- moderate vendors
- view ghotok accounts
- view ghotok balances and requests

### Reporting

- view daily sales
- view monthly sales
- view annual sales
- view custom date sales
- view profile activity counts

## Super admin permissions

### Role and settings

- all admin permissions
- create admins
- set admin passwords or reset access
- assign admin permissions
- configure payment gateways
- configure plans
- configure coupons
- configure office payment rules
- configure match mail
- configure campaign mailing
- configure SEO and content settings

### Ghotok and vendor administration

- create ghotok accounts
- activate or suspend ghotok
- adjust ghotok credit balance
- manage vendor billing rules
- view vendor billing reports

### Global control

- view all audits
- manage environment-level settings exposed to app
- control feature flags

## Sensitive actions requiring audit log

- profile approval
- profile rejection
- profile deletion
- manual payment approval
- membership upgrade by admin
- coupon creation or disable
- credit adjustment
- impersonation start
- impersonation end
- password reset by admin
- gateway configuration change

## Sensitive actions requiring extra confirmation

- delete profile permanently
- refund payment
- reduce ghotok wallet balance
- suspend vendor
- suspend admin
- disable payment gateway

## Policy notes

- admin and super admin must not share credentials
- ghotok cannot access members not linked to them in impersonation mode
- vendor cannot access member private contact info directly without approved lead rules
- members cannot bypass plan restrictions through direct route access
