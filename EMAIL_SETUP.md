# EmailJS Setup For Sadaf Boutique

The website is now wired for your EmailJS account.

Configured from your screenshots:

```text
Service ID: service_2cbkncb
Order template: kjh1fb
Contact template: v3edt7j
Owner name: Sadaf Khan
Owner email: mohdfaisal309007@gmail.com
```

The only value still needed is your EmailJS Public Key.

## Add Public Key

In EmailJS dashboard:

`Account` -> `General` -> `Public Key`

Copy it into `.env.local`:

```bash
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Then restart the website:

```bash
npm run dev
```

## Template Variables

Make sure your Order Confirmation and Contact templates use these variables:

```text
customer_name
customer_email
customer_phone
customer_address
customer_landmark
order_items
order_total
delivery_date
delivery_boy_phone
service
message
owner_email
owner_name
boutique_name
to_email
reply_to
```

For order confirmation, set the template recipient email to `{{to_email}}`.
The website sends the same order template twice:

- once with `to_email` as the customer email
- once with `to_email` as `mohdfaisal309007@gmail.com`

If your EmailJS order template keeps the current `mohdfaisal309007@gmail.com {{customer_err}}` recipient format, the website also sends `customer_err` so the customer can be included.

For contact form, set the template recipient to `{{to_email}}` or directly to `mohdfaisal309007@gmail.com`.
The contact form does not open WhatsApp; it only sends email.

## Vercel

In Vercel, add the same variables in:

`Project Settings` -> `Environment Variables`

Then redeploy.
