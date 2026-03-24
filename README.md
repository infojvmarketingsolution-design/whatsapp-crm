# WhatsApp API + CRM Platform

This project is a multi-tenant WhatsApp CRM platform built with Node.js/Express (Backend) and React/Vite (Frontend).

## Project Structure
- `backend/`: Node.js server handling API and WhatsApp webhooks.
- `frontend/`: React application built with Vite and Tailwind CSS.

## Deployment to Hostinger

1. **Build Frontend**: Run `npm install && npm run build` in the `frontend` directory.
2. **Setup Backend**: The backend is configured to serve the frontend dist from `backend/public`.
3. **Hostinger Node.js**:
   - Create a Node.js application in Hostinger hPanel.
   - Point to `backend/server.js` as the entry point.
   - Set up environment variables in Hostinger hPanel.

## Environment Variables
Required variables (copy to Hostinger hPanel):
- `PORT`
- `CORE_DB_URI` (Use MongoDB Atlas)
- `JWT_SECRET`
- `REDIS_URL` (Optional if not using queue)
- `META_ACCESS_TOKEN`
- `META_PHONE_NUMBER_ID`
- `META_WABA_ID`
- `META_WEBHOOK_VERIFY_TOKEN`
