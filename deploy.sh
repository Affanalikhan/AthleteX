#!/bin/bash

echo "🚀 AthleteX Deployment Script"
echo "=============================="
echo ""

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null
then
    echo "📦 Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Deploying to Netlify..."
    netlify deploy --prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo "🎉 Your site is now live!"
    else
        echo "❌ Deployment failed. Please check the error messages above."
        exit 1
    fi
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi
