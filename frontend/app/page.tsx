import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Globe, 
  MessageSquare, 
  Upload, 
  Search, 
  Zap,
  Shield,
  Cloud,
  Brain
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">PDF RAG</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-in">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Chat with Your Documents
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Upload PDFs, crawl websites, and have intelligent conversations with your content using AI-powered retrieval-augmented generation.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Chatting
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          Powerful Features
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* PDF Upload & Chat */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-blue-600" />
                <CardTitle>PDF Upload & Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Upload PDF documents and chat with them using AI. Get instant answers from your documents with context-aware responses.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Website Crawling */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-green-600" />
                <CardTitle>Website Crawling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Crawl entire websites and extract content for AI-powered conversations. Perfect for documentation sites and knowledge bases.
              </CardDescription>
            </CardContent>
          </Card>

          {/* AI-Powered Chat */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <CardTitle>AI-Powered Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Intelligent conversations with your content using Google's Gemini AI. Get accurate, context-aware responses every time.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Vector Search */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Search className="h-8 w-8 text-orange-600" />
                <CardTitle>Vector Search</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Advanced vector search powered by Qdrant. Find the most relevant content from your documents instantly.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Cloud Storage */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cloud className="h-8 w-8 text-cyan-600" />
                <CardTitle>Cloud Storage</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Secure cloud storage with UploadThing. Your documents are safely stored and accessible from anywhere.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Smart Processing */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-indigo-600" />
                <CardTitle>Smart Processing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Background processing with BullMQ. Documents are automatically processed and indexed for optimal performance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20 bg-white">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Upload Content</h3>
            <p className="text-gray-600">
              Upload PDF documents or crawl websites to add your content to the system.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. AI Processing</h3>
            <p className="text-gray-600">
              Our AI automatically processes and indexes your content for intelligent retrieval.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Chat & Learn</h3>
            <p className="text-gray-600">
              Ask questions and get intelligent, context-aware responses from your content.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already chatting with their documents and websites.
        </p>
        <Link href="/sign-in">
          <Button size="lg" className="text-lg px-8 py-4">
            Start Your Free Trial
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-6 w-6" />
            <h3 className="text-xl font-bold">PDF RAG</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Intelligent document chat powered by AI
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span>© 2025 PDF RAG. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
      </div>
      </div>
      </footer>
    </div>
  );
}


