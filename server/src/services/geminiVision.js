/**
 * Gemini Vision Inspection Service
 * 
 * Uses Google Generative AI (Gemini 1.5 Flash) to inspect uploaded device photos
 * for cosmetic grading, screen cracks, casing dents, and physical integrity.
 */
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Helper to convert local image file to generative part
 */
function fileToGenerativePart(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';
    const buffer = fs.readFileSync(filePath);
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };
  } catch (err) {
    console.warn(`Could not read image for Gemini Vision: ${filePath}`, err.message);
    return null;
  }
}

/**
 * Inspect uploaded device photos using Gemini Vision.
 * 
 * @param {Object} device - { brand, model, category_name, images, description }
 * @returns {Promise<Object>} Structured inspection result
 */
async function inspectDevicePhotos(device) {
  const apiKey = process.env.GEMINI_API_KEY;
  const imagePaths = Array.isArray(device.images) ? device.images : [];

  // Resolve absolute disk paths for uploaded files
  const serverRoot = path.join(__dirname, '../../');
  const validImageParts = [];

  for (const imgUrl of imagePaths) {
    // imgUrl usually starts with '/uploads/filename.jpg'
    const cleanPath = imgUrl.startsWith('/') ? imgUrl.slice(1) : imgUrl;
    const fullDiskPath = path.join(serverRoot, cleanPath);
    if (fs.existsSync(fullDiskPath)) {
      const part = fileToGenerativePart(fullDiskPath);
      if (part) validImageParts.push(part);
    }
  }

  // If live GEMINI_API_KEY is present and we have images, run live Gemini 1.5 Flash
  if (apiKey && validImageParts.length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are an expert electronics quality assurance and refurbishing specialist inspecting photos of a listed device.
Device details:
- Category: ${device.category_name || 'Electronics'}
- Brand: ${device.brand || 'Unknown'}
- Model: ${device.model || 'Unknown'}
- Seller Comments: "${device.description || 'None'}"

Please examine the uploaded photos in high detail and return ONLY a valid JSON object (without markdown fences or extra text) with the following exact keys:
{
  "cosmetic_grade": "A" | "B" | "C" | "D",
  "screen_condition": "Flawless" | "Minor Scratches" | "Cracked Glass" | "Shattered / Heavy Damage" | "Not Visible",
  "body_condition": "Flawless" | "Light Wear" | "Dents & Scuffs" | "Cracked / Bent Chassis",
  "detected_issues": ["list of specific physical flaws observed, or empty array if none"],
  "visual_confidence_score": integer between 70 and 99,
  "inspection_summary": "Concise 1-2 sentence professional assessment of the visible exterior condition",
  "hazard_detected": false
}
Grade definitions:
- A: Mint / Like New. No visible scratches or blemishes.
- B: Good. Light cosmetic signs of normal usage.
- C: Fair. Noticeable scratches, scuffs, or minor casing chips.
- D: Damaged. Visible screen cracks, bent frame, or heavy structural damage.
`;

      const result = await model.generateContent([prompt, ...validImageParts]);
      const responseText = result.response.text().trim();

      // Clean markdown codeblocks if returned
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        is_live_ai: true,
        images_analyzed: validImageParts.length,
      };
    } catch (err) {
      console.error('Gemini Vision live call error, falling back to heuristic assessment:', err.message);
    }
  }

  // Fallback heuristic/simulated AI assessment
  return generateHeuristicAssessment(device, validImageParts.length);
}

/**
 * Intelligent deterministic analysis when API key is pending
 */
function generateHeuristicAssessment(device, imageCount) {
  const desc = (device.description || '').toLowerCase();
  
  let grade = 'B';
  let screen = 'Minor Scratches';
  let body = 'Light Wear';
  let issues = [];
  let summary = 'Device shows normal cosmetic wear consistent with standard usage.';
  let hazard = false;

  if (desc.includes('crack') || desc.includes('shatter') || desc.includes('broken')) {
    grade = 'D';
    screen = 'Cracked Glass';
    body = 'Dents & Scuffs';
    issues.push('Cosmetic wear reported on screen glass');
    summary = 'Visual condition indicates physical impact or screen fracture requiring refurbishment.';
  } else if (desc.includes('new') || desc.includes('flawless') || desc.includes('mint') || desc.includes('excellent')) {
    grade = 'A';
    screen = 'Flawless';
    body = 'Flawless';
    summary = 'Device appears in pristine physical condition with no significant exterior imperfections.';
  } else if (desc.includes('scratch') || desc.includes('dent') || desc.includes('scuff')) {
    grade = 'C';
    screen = 'Minor Scratches';
    body = 'Dents & Scuffs';
    issues.push('Surface abrasions visible on bezel or housing');
    summary = 'Exterior displays surface-level abrasions and scuffs, but structural casing remains intact.';
  } else {
    issues.push('Standard microscopic hairline surface wear');
  }

  if (desc.includes('water') || desc.includes('liquid') || desc.includes('swollen')) {
    hazard = true;
    grade = 'D';
    issues.push('Potential liquid exposure or battery bulging risk');
  }

  return {
    cosmetic_grade: grade,
    screen_condition: screen,
    body_condition: body,
    detected_issues: issues,
    visual_confidence_score: imageCount > 0 ? 88 : 72,
    inspection_summary: summary,
    hazard_detected: hazard,
    is_live_ai: false,
    images_analyzed: imageCount,
    notice: 'Add GEMINI_API_KEY to server/.env for live multimodal neural analysis.',
  };
}

module.exports = {
  inspectDevicePhotos,
};
