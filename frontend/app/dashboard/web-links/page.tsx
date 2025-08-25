"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, ExternalLink } from "lucide-react";
import axios from "@/lib/axios";

export default function WebLinksPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  const handleCrawl = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setCrawledUrls([]);

    try {
      // Use the new API route instead of the old server
      const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/weblinks/stream?domain=${encodeURIComponent(url)}`);

      eventSource.onmessage = (event) => {
        if (event.data.startsWith('data: ')) {
          const urlData = JSON.parse(event.data.slice(6));
          setCrawledUrls(prev => [...prev, urlData]);
        }
      };

      eventSource.addEventListener('done', (event) => {
        const data = JSON.parse(event.data);
        setCrawledUrls(data);
        setIsStreaming(false);
        eventSource.close();
        toast({
          title: "Crawling completed",
          description: `Found ${data.length} URLs`,
        });
      });

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setIsStreaming(false);
        eventSource.close();
        toast({
          title: "Error",
          description: "Failed to crawl website",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error("Crawling error:", error);
      toast({
        title: "Error",
        description: "Failed to start crawling",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Website Crawler</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crawl Website</CardTitle>
          <CardDescription>
            Enter a website URL to crawl and extract all accessible pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              onClick={handleCrawl} 
              disabled={isLoading || !url}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crawl"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isStreaming && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Crawling in progress...
            </CardTitle>
            <CardDescription>
              Found {crawledUrls.length} URLs so far
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {crawledUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crawled URLs ({crawledUrls.length})</CardTitle>
            <CardDescription>
              All accessible pages found on the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {crawledUrls.map((crawledUrl, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                >
                  <span className="text-sm font-mono truncate flex-1">
                    {crawledUrl}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(crawledUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
