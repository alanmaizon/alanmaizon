# TRELLIS custom domain

The public domain is connected in AWS Amplify and Route 53, not GitHub Pages.
Both `alanmaizon.com` and `www.alanmaizon.com` target Amplify app
`d3lhjc99f3rc0a`, branch `trellis-aws-prototype`, in `eu-west-1`.
GitHub continues to hold the source and pull request; no default-branch merge is
needed for this domain mapping.

Amplify manages the HTTPS certificate and records in the existing Route 53
hosted zone `Z07288751XRBFU302AJ8P`. Keep certificate-validation CNAME records so
renewal can continue. Do not change the zone's nameservers, SOA, or unrelated
records. The old CloudFront distribution `E1PUDB7GE835PV` pointed to GitHub Pages
and still claimed the apex hostname; that alias was removed to release it for
Amplify. The distribution itself was not deleted.

## Reproduce or manage the mapping

The standalone `infra/domain` Terraform root manages only the association with
an existing Amplify app. It does not create a second app, a hosted zone, or a GPU.
Amplify manages DNS; do not also declare the same records in Terraform.

For an existing association, import before planning:

```bash
cd infra/domain
terraform init
terraform import -var-file=terraform.tfvars.example \
  aws_amplify_domain_association.trellis d3lhjc99f3rc0a/alanmaizon.com
terraform plan -var-file=terraform.tfvars.example
```

For a fresh app/domain, supply the appropriate variables and review a plan
before applying. Preserve Terraform state. The base `infra/terraform` root was
not used to create the current prototype's storage resources; import those
existing resources before applying it, rather than accidentally creating a
second stack.

The S3 bucket's read-only CORS origins must include both custom hosts and the
Amplify branch URL. This is represented by `browser_origins` in the base
Terraform root. All API and artifact links are relative, so workers may keep
using the stable Amplify URL while browsers use the custom domain.

## Roll back the website

Before this migration, the apex A record had TTL 60 and value `216.198.79.1`;
`www` was a CNAME with TTL 60 to `cf899eab51be3ecc.vercel-dns-017.com.`.
To restore the previous Vercel site, first confirm that Vercel still serves the
domain, then upsert those two records in Route 53. Keep the old deployment until
the new site is verified. Do not delete the zone, certificate-validation records,
S3 results, or GPU storage. No GPU lifecycle setting is changed by DNS migration.
