# Skills Extraction with GPT

This feature uses OpenAI's GPT models to automatically extract and categorize skills from CV/resume text, providing structured analysis for job matching and candidate evaluation.

## 🚀 Features

- **Smart Skill Extraction**: Uses GPT-4o-mini to identify all mentioned skills
- **Automatic Categorization**: Organizes skills into meaningful categories
- **Experience Level Detection**: Determines candidate experience level
- **Candidate Summary**: Generates brief professional summary
- **Error Handling**: Robust error handling with fallback options
- **API & UI Integration**: Works both programmatically and through the UI

## 📦 Installation

The OpenAI package is already installed. You just need to configure your API key:

```bash
# OpenAI package already installed via:
npm install openai
```

## ⚙️ Configuration

1. **Get OpenAI API Key**:
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Set Environment Variable**:
   Create a `.env.local` file in your project root:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

3. **Verify Setup**:
   The API will return an error if the key is missing or invalid.

## 🎯 Usage

### Option 1: Using the FileUploader Component

The easiest way to use skills extraction:

1. Upload a PDF CV using the FileUploader component
2. Check the "Extract Skills with AI" checkbox
3. Click "Extract CV Text"
4. View the categorized skills results below the extracted text

### Option 2: Direct API Calls

#### Extract skills from text:
```javascript
const response = await fetch('/api/extract-skills', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: cvText })
});

const result = await response.json();
```

#### Extract skills during PDF upload:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('extractSkills', 'true');

const response = await fetch('/api/extract-cv', {
  method: 'POST',
  body: formData
});
```

## 📊 Response Format

The skills extraction returns structured data:

```json
{
  "success": true,
  "data": {
    "skills": ["JavaScript", "React", "Node.js", "Python", "..."],
    "categories": {
      "technical": ["JavaScript", "React", "Node.js", "Python"],
      "soft": ["Communication", "Leadership", "Problem-solving"],
      "languages": ["English", "Spanish"],
      "tools": ["VS Code", "Git", "Docker"],
      "frameworks": ["React", "Express.js", "Django"],
      "certifications": ["AWS Certified", "Google Cloud Professional"]
    },
    "experience_level": "Senior",
    "summary": "Experienced software engineer with strong full-stack development skills..."
  },
  "metadata": {
    "textLength": 2500,
    "totalSkills": 25,
    "categoriesCount": {
      "technical": 8,
      "soft": 5,
      "languages": 2,
      "tools": 4,
      "frameworks": 4,
      "certifications": 2
    }
  }
}
```

## 🛠️ API Endpoints

### POST /api/extract-skills
Extract skills from provided CV text.

**Request Body:**
```json
{
  "text": "CV or resume text content..."
}
```

**Response:** Structured skills data (see format above)

### POST /api/extract-cv
Upload PDF and optionally extract skills.

**Form Data:**
- `file`: PDF file
- `extractSkills`: "true" or "false" (optional)

**Response:** PDF text + optional skills data

### GET /api/extract-skills
Get API documentation and health check.

## 🏷️ Skill Categories

Skills are automatically categorized into:

- **Technical**: Programming languages, databases, operating systems
- **Soft Skills**: Communication, leadership, problem-solving abilities
- **Languages**: Human languages (English, Spanish, French, etc.)
- **Tools**: Software applications, IDEs, platforms
- **Frameworks**: Libraries, frameworks, and development platforms
- **Certifications**: Professional certifications and qualifications

## 💡 Best Practices

1. **CV Quality**: Clean, well-formatted CVs produce better results
2. **API Limits**: Be aware of OpenAI API rate limits and costs
3. **Error Handling**: Always implement proper error handling
4. **Caching**: Consider caching results for repeated extractions
5. **Validation**: Validate extracted skills for accuracy

## 🔧 Troubleshooting

### Common Issues:

**"OpenAI API key not configured"**
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart your development server after adding the key

**"Skills extraction failed"**
- Check your OpenAI account has sufficient credits
- Verify the API key is valid and active
- Check network connectivity

**"No skills found"**
- CV text might be too short or unclear
- Try with a more detailed CV
- Check if the text extraction was successful first

**Rate limiting errors**
- Implement retry logic with exponential backoff
- Consider upgrading your OpenAI plan for higher limits

## 🎨 Customization

### Modify Skill Categories
Edit the prompt in [lib/openai-skills.ts](../lib/openai-skills.ts) to add or change categories.

### Change AI Model
Update the model in the OpenAI configuration:
```javascript
model: "gpt-4o-mini", // or "gpt-4", "gpt-3.5-turbo"
```

### Adjust Analysis Depth
Modify the prompt to request different types of analysis (years of experience, salary expectations, etc.).

## 📈 Cost Considerations

- GPT-4o-mini is cost-effective for this use case
- Average cost per CV: ~$0.001-0.005 USD
- Consider batch processing for multiple CVs
- Monitor usage through OpenAI dashboard

## 🔐 Security & Privacy

- API keys are server-side only (never exposed to client)
- CV text is sent to OpenAI for processing
- No data is stored by default
- Consider data privacy regulations (GDPR, etc.)

## 🤝 Contributing

To improve the skills extraction:

1. **Better Prompts**: Enhance the GPT prompt for more accurate extraction
2. **New Categories**: Add industry-specific skill categories
3. **Post-processing**: Add validation and normalization logic
4. **UI Improvements**: Enhance the skills display components

## 📚 Examples

See [examples/skills-extraction-examples.ts](../examples/skills-extraction-examples.ts) for complete usage examples and testing functions.