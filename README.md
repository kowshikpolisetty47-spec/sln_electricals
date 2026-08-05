# Quick Bill Pro

Build a modern, responsive web application for an Electrical & Plumbing Materials Store. The main purpose of this website is to help electricians and plumbers quickly prepare an estimation bill for customers.

Home Page

 Clean professional design with blue and white color theme.

 Store name at the top.

 Navigation menu: Home, Create Estimate, Products, Saved Estimates.

Create Estimate Page

Create a dynamic invoice table with the following columns:

 Item Name (dropdown with searchable products)

 Quantity (number input)

 Price per Piece (automatically filled based on selected item, but editable)

 Total Price (Quantity × Price per Piece, calculated automatically)

 Remove Item button

Add an "Add Item" button to insert new rows dynamically.

Bottom Summary

Display:

 Total Number of Items

 Grand Total Amount

 GST (optional toggle)

 Final Total

Additional Features

 Search products by name.

 Auto-complete product names.

 Save estimate.

 Print estimate.

 Download estimate as PDF.

 Generate invoice number automatically.

 Add customer name and phone number.

 Add electrician name.

 Display current date automatically.

Admin Panel

Create an admin dashboard where the shop owner can:

 Add new products.

 Edit product prices.

 Delete products.

 Organize products by categories such as Wires, Switches, Pipes, Fittings, Lights, Fans, Plumbing Accessories, etc.

Product Database

Store products with:

 Product Name

 Category

 Unit (Piece, Meter, Box, Roll, etc.)

 Price

UI Requirements

 Responsive for desktop, tablet, and mobile.

 Fast loading.

 Modern card-based interface.

 Clean invoice-style table.

 Professional business appearance.

 Use icons for Print, Save, PDF, and Add Item.

Technology

Build the frontend with React and Tailwind CSS. Use Firebase (or Supabase) as the backend database. Store all products in the database so prices update automatically in the estimation page.

The application should behave like a simple billing software used in electrical and plumbing wholesale shops, allowing employees to create quotations within a few minutes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ad162e5-6562-41fe-b442-f08b47accdfe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
