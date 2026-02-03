#!/bin/bash

# Temp Mail Worker Bootstrap Script
# This script automates the setup process for the Temp Mail Worker project.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Temp Mail Worker Setup...${NC}"

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Please install Bun first: https://bun.sh${NC}"
    exit 1
fi

# 1. Install Dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
bun install

# 2. Cloudflare Login
echo -e "\n${YELLOW}🔑 Logging into Cloudflare...${NC}"
echo -e "This will open your browser for authentication."
bun wrangler login

# 3. D1 Database Setup
echo -e "\n${YELLOW}🗄️ Setting up D1 Database...${NC}"
DB_OUTPUT=$(bun run db:create)
echo "$DB_OUTPUT"

# Extract database_id from output
DB_ID=$(echo "$DB_OUTPUT" | grep "database_id =" | sed 's/.*database_id = "\(.*\)".*/\1/')

if [ -z "$DB_ID" ]; then
    echo -e "${RED}❌ Failed to extract database_id. Please update wrangler.jsonc manually.${NC}"
else
    echo -e "${GREEN}✅ Database created with ID: $DB_ID${NC}"
    
    # Update wrangler.jsonc with the new database_id
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"database_id\": \".*\"/\"database_id\": \"$DB_ID\"/" wrangler.jsonc
    else
        sed -i "s/\"database_id\": \".*\"/\"database_id\": \"$DB_ID\"/" wrangler.jsonc
    fi
    echo -e "${GREEN}✅ Updated wrangler.jsonc with database_id.${NC}"
fi

# 4. Apply Database Schema and Indexes
echo -e "\n${YELLOW}📝 Applying database schema and indexes...${NC}"
bun run db:tables
bun run db:indexes
bun run db:api-keys

# 5. R2 Bucket Setup
# echo -e "\n${YELLOW}🪣 Setting up R2 Buckets...${NC}"
# bun run r2:create
# bun run r2:create-preview

# 6. Optional: Master Key for API
echo -e "\n${YELLOW}🔑 Generating Master Key...${NC}"
MASTER_KEY=$(openssl rand -hex 32)
echo -e "Your Master Key is: ${GREEN}$MASTER_KEY${NC}"
echo -e "Setting MASTER_KEY secret in Cloudflare..."
echo "$MASTER_KEY" | bun wrangler secret put MASTER_KEY

# 7. Final Instructions
echo -e "\n${GREEN}✨ Setup Complete! ✨${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. ${YELLOW}Email Routing:${NC} Go to Cloudflare Dashboard -> Domain -> Email -> Email Routing."
echo -e "   Create a catch-all rule pointing to your Worker: ${GREEN}temp-mail${NC}"
echo -e "2. ${YELLOW}Attachments:${NC} If you want to enable attachments, uncomment the 'r2_buckets' section in ${GREEN}wrangler.jsonc${NC}."
echo -e "3. ${YELLOW}Telegram Logging:${NC} If you want Telegram logs, set ${GREEN}TELEGRAM_BOT_TOKEN${NC} and ${GREEN}TELEGRAM_CHAT_ID${NC} secrets."
echo -e "   Example: ${NC}bun wrangler secret put TELEGRAM_BOT_TOKEN${NC}"
echo -e "4. ${YELLOW}Deploy:${NC} Run ${GREEN}bun run deploy${NC} to push your worker to production."

echo -e "\n${GREEN}Happy mailing!${NC}"
