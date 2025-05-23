# OrgaMaster AI

OrgaMaster AI is an intelligent task management application that integrates Perplexity AI capabilities to streamline your productivity workflow. This project was developed for the Perplexity AI Hackathon.

![OrgaMaster AI Banner](https://example.com/banner-image.png)

## Project Overview

OrgaMaster AI addresses the challenge of task management and information overload by combining structured task organization with powerful AI research capabilities. Our solution helps users efficiently manage tasks while providing contextually relevant information through Perplexity's advanced search technology.

### Key Features

- **Smart Task Management**: Create, organize, and track tasks with customizable details
- **AI-Powered Task Generation**: Generate structured task details from simple descriptions
- **Deep Research Integration**: Access Perplexity AI research capabilities to gather comprehensive information related to tasks
- **Intelligent Subtask Generation**: AI automatically breaks down complex tasks into manageable subtasks
- **Persistent Research Storage**: Save valuable research findings directly with your tasks
- **Smart Filtering**: Sort and filter tasks by various criteria
- **Cross-Platform Experience**: Web, Android and iOS support through Capacitor

## Perplexity AI Integration

OrgaMaster AI leverages Perplexity's powerful search and knowledge retrieval capabilities in several innovative ways:

### Deep Research Function

Our core AI research functionality uses Perplexity's API to conduct in-depth investigation of topics related to user tasks. When a user requests research on a specific task, we:

1. Extract key concepts and context from the task description
2. Formulate optimized queries for the Perplexity API
3. Process and structure the returned information for maximum usefulness
4. Present research findings with proper attribution and sources

The integration allows users to stay in their workflow while accessing current, relevant information without context switching between applications.

### Implementation Architecture

We've implemented the Perplexity integration through Supabase Edge Functions to securely manage API credentials and provide a consistent experience:

```
Client Request -> Supabase Edge Function -> Perplexity API -> Processed Results -> Client Display
```

Our implementation includes:

- Rate limiting and usage monitoring
- Custom prompt engineering to extract the most relevant information
- Response formatting for optimal readability
- Permission-based access control

## Demo and Screenshots

### Live Demo

Experience OrgaMaster AI: [Live Demo](https://orgamaster.artifexai.nl/)

### Video Walkthrough

Watch our demo video: [YouTube Demo](https://youtube.com/example)

### Screenshots

![Dashboard View](https://example.com/dashboard.png)
![Research Integration](https://example.com/research.png)
![Mobile Experience](https://example.com/mobile.png)

## Getting Started

### Prerequisites

- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account (for backend services)
- Perplexity API key (for AI research functionality)

### Installation and Setup

```sh
# Clone the repository
git clone https://github.com/rsieuw/orga-master-ai-nexus.git

# Navigate to the project directory
cd orga-master-ai-nexus

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase and Perplexity API credentials

# Start the development server
npm run dev
```

### Environment Configuration

Create a `.env` file with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
```

### Building for Production

```sh
# Build for production
npm run build

# Preview the production build
npm run preview
```

### Mobile Development

This project uses Capacitor for native mobile deployments:

```sh
# Add Capacitor platforms
npx cap add android
npx cap add ios

# Sync web code to native projects
npx cap sync
```

## Technology Stack

### Frontend

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tooling and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library built on Radix UI
- **TanStack Query**: Data fetching and state management
- **React Router**: Navigation and routing
- **i18next**: Internationalization
- **Capacitor**: Cross-platform native runtime

### Backend (Supabase)

- **Authentication**: User accounts and session management
- **PostgreSQL Database**: Data storage
- **Edge Functions**: Serverless API endpoints (Deno runtime)
- **Row-Level Security**: Data access control

### AI Integration

- **Perplexity AI**: Advanced research capabilities through the Sonar API
- **Edge Functions**: Custom AI processing logic
- **Schema Design**: Optimized storage for AI research results

## Challenges and Solutions

### Challenge 1: Complex Research Integration

Implementing deep research that remains contextually relevant to tasks required sophisticated prompt engineering and result processing.

**Solution**: We developed a multi-step process that extracts key concepts from tasks, generates targeted research queries, and formats results for optimal presentation within the task context.

### Challenge 2: Mobile Performance

Ensuring the AI features performed well on mobile devices with limited resources.

**Solution**: Implemented progressive loading, response caching, and optimized rendering to provide a smooth experience across all devices.

### Challenge 3: User Experience

Creating an intuitive interface that seamlessly integrates AI capabilities without overwhelming users.

**Solution**: Used iterative design and user testing to refine the interaction model, resulting in contextualized AI features that feel natural within the task management workflow.

## Future Development

- **Multi-modal Research**: Extend Perplexity integration to include image and voice inputs
- **Collaborative Research**: Enable team members to collaboratively refine research queries
- **Predictive Insights**: Use pattern recognition to suggest research topics before users request them
- **Custom Knowledge Base**: Allow organizations to incorporate proprietary information sources

## Developer

This project was entirely developed as a solo effort by [Rakesh Sieuw](https://github.com/rsieuw), showcasing the potential of combining task management with Perplexity AI's powerful research capabilities.

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- [Perplexity AI](https://perplexity.ai) for the powerful Sonar API
- [Supabase](https://supabase.com) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) for the beautiful component library

## License

This project is proprietary software. All rights reserved.

## Contact

Project Link: [https://github.com/rsieuw/orga-master-ai-nexus](https://github.com/rsieuw/orga-master-ai-nexus)

## Demo Toegang

Voor demonstratie doeleinden kun je inloggen met de volgende gegevens:

- **E-mail:** demo@exampl.com
- **Wachtwoord:** demo2025

Deze demo account heeft beperkte rechten en is bedoeld om de basis functionaliteiten van de applicatie te verkennen.
