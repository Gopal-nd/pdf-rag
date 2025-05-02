import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";

export async function loadWebDocuments(domain: string): Promise<any[]> {
    const loader = new PlaywrightWebBaseLoader(domain, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'domcontentloaded',
      },
    });
  
    try {
      const docs = await loader.load();
      console.log('Loaded docs:', docs.length);
      return docs;
    } catch (err) {
      console.error('Playwright loader failed:', err);
      return [];
    }
  }