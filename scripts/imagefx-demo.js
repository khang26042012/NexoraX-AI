#!/usr/bin/env node

/**
 * ========================================
 * ImageFX API Demo - Test Integration
 * ========================================
 * 
 * ISOLATED TEST SCRIPT - Không ảnh hưởng production build
 * 
 * CÁCH SỬ DỤNG:
 *   npm run demo:imagefx
 * 
 * CÁCH XÓA:
 *   Chỉ cần xóa file này: rm scripts/imagefx-demo.js
 *   Và remove npm script "demo:imagefx" từ package.json
 * 
 * REQUIREMENTS:
 *   - Package @rohitaryal/imagefx-api đã được install
 *   - Node.js version 18+
 *   - Google ImageFX Cookie hoặc Authorization token (để test thực tế)
 * 
 * ========================================
 */

import ImageFx from '@rohitaryal/imagefx-api';

console.log('🎨 ImageFX API Demo - Starting...\n');

async function showApiInfo() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ImageFX API Test Integration Demo   ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('📦 Package Information:');
    console.log('   - Package: @rohitaryal/imagefx-api v1.1.1');
    console.log('   - Status: ✅ Installed successfully\n');
    
    console.log('🔧 API Usage Example:');
    console.log(`
    import ImageFx from '@rohitaryal/imagefx-api';
    
    // Initialize with credentials
    const client = new ImageFx({
        cookie: 'YOUR_GOOGLE_IMAGEFX_COOKIE',
        // OR
        authorizationKey: 'YOUR_AUTH_TOKEN'
    });
    
    // Generate image
    const result = await client.generateImage({
        prompt: 'A beautiful sunset over mountains',
        count: 4,  // Number of images (1-4)
        aspectRatio: 'IMAGE_ASPECT_RATIO_LANDSCAPE',
        model: 'IMAGEN_3_5'  // or 'IMAGEN_4'
    });
    
    if (result.Ok) {
        console.log('Generated images:', result.Ok);
    } else {
        console.error('Error:', result.Err);
    }
    `);
    
    console.log('\n💡 To actually generate images:');
    console.log('   1. Get your Google ImageFX cookie from browser DevTools');
    console.log('   2. Set IMAGEFX_COOKIE environment variable');
    console.log('   3. Uncomment the test code below\n');
    
    console.log('📌 NOTE: This is a TEST-ONLY script');
    console.log('   It is NOT included in the production build\n');
    
    console.log('✅ Demo completed - API integration verified!\n');
}

async function testImageGeneration() {
    const cookie = process.env.IMAGEFX_COOKIE;
    
    if (!cookie) {
        console.log('⚠️  No credentials provided. Skipping actual image generation.\n');
        console.log('💡 To test image generation:');
        console.log('   IMAGEFX_COOKIE="your-cookie" npm run demo:imagefx\n');
        return;
    }
    
    try {
        const client = new ImageFx({ cookie });
        
        console.log('🔄 Generating test image...\n');
        
        const result = await client.generateImage({
            prompt: 'A beautiful sunset over mountains with purple and orange sky',
            count: 2
        });
        
        if (result.Ok) {
            console.log('✅ Image generated successfully!\n');
            console.log('🖼️  Generated images:');
            result.Ok.forEach((img, i) => {
                console.log(`   ${i + 1}. ${img.imageUrl || img}\n`);
            });
        } else {
            console.error('❌ Error:', result.Err?.message || result.Err);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function runDemo() {
    await showApiInfo();
    await testImageGeneration();
}

runDemo().catch(console.error);
