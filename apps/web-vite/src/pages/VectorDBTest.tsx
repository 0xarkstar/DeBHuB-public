import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePureIrysClient } from "@debhub/pure-irys-client";
import {
  useSemanticSearch,
  useQuestionAnswer,
  useDocumentSuggestions,
  useCreateVector,
  useVectorDBStatus,
} from "@debhub/pure-irys-client";

export default function VectorDBTest() {
  const { client } = usePureIrysClient();
  const { isAvailable, isChecking } = useVectorDBStatus(client);
  const { results, isSearching, search } = useSemanticSearch(client);
  const { answer, isAsking, ask } = useQuestionAnswer(client);
  const { suggestions, getSuggestions } = useDocumentSuggestions(client);
  const { isCreating, createVector } = useCreateVector(client);

  const [searchQuery, setSearchQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [docContent, setDocContent] = useState("");
  const [testDocId, setTestDocId] = useState("test-doc-1");
  const [testContent, setTestContent] = useState("Blockchain technology enables decentralized applications");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vector DB Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Test Pure Irys Vector Database features with AI-powered semantic search
        </p>
      </div>

      {/* Status Check */}
      <Card>
        <CardHeader>
          <CardTitle>Vector DB Status</CardTitle>
          <CardDescription>Check if Vector DB is available</CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <p>Checking...</p>
          ) : isAvailable ? (
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ Vector DB is available and ready to use!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertDescription className="text-yellow-700">
                ⚠️ Vector DB is not available. Make sure:
                <ul className="list-disc ml-6 mt-2">
                  <li>VectorRegistry contract is deployed</li>
                  <li>Client is properly initialized</li>
                  <li>Contract address is configured</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Vector */}
      <Card>
        <CardHeader>
          <CardTitle>1. Create Document Vector</CardTitle>
          <CardDescription>
            Create vector embeddings for documents (uses mock embeddings in development)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Document ID</label>
            <Input
              value={testDocId}
              onChange={(e) => setTestDocId(e.target.value)}
              placeholder="test-doc-1"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Enter document content..."
              rows={3}
              className="mt-1"
            />
          </div>
          <Button
            onClick={async () => {
              if (!client || !isAvailable) {
                alert("Vector DB not available");
                return;
              }
              const success = await createVector(testDocId, testContent, {
                category: "test",
                timestamp: Date.now(),
              });
              if (success) {
                alert(`✅ Vector created for ${testDocId}`);
              } else {
                alert("❌ Failed to create vector");
              }
            }}
            disabled={isCreating || !isAvailable}
          >
            {isCreating ? "Creating..." : "Create Vector"}
          </Button>
        </CardContent>
      </Card>

      {/* Semantic Search */}
      <Card>
        <CardHeader>
          <CardTitle>2. Semantic Search</CardTitle>
          <CardDescription>
            Find documents by meaning, not just keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Search Query</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="decentralized blockchain systems"
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => search(searchQuery, { limit: 10, threshold: 0.5 })}
            disabled={isSearching || !isAvailable || !searchQuery}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>

          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results ({results.length})</h3>
              <div className="space-y-2">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{result.docId}</p>
                        {result.title && (
                          <p className="text-sm text-muted-foreground">{result.title}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Q&A */}
      <Card>
        <CardHeader>
          <CardTitle>3. AI Question-Answer (RAG)</CardTitle>
          <CardDescription>
            Ask questions and get AI-generated answers based on your documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is blockchain used for?"
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => ask(question, { maxContext: 3 })}
            disabled={isAsking || !isAvailable || !question}
          >
            {isAsking ? "Thinking..." : "Ask Question"}
          </Button>

          {answer && (
            <div className="mt-4 p-4 border rounded-lg bg-accent/50">
              <h3 className="font-semibold mb-2">Answer</h3>
              <p className="mb-3">{answer.answer}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Confidence: {(answer.confidence * 100).toFixed(1)}%</p>
                <p>Method: {answer.method}</p>
                <p>Sources: {answer.sources.length} documents</p>
              </div>
              {answer.sources.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Source Documents:</p>
                  <ul className="text-sm space-y-1">
                    {answer.sources.map((source, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {source.docId} {source.title && `- ${source.title}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>4. Document Suggestions</CardTitle>
          <CardDescription>
            Get real-time document suggestions based on content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Smart contracts are self-executing programs on blockchain..."
              rows={3}
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => getSuggestions(docContent, { limit: 5 })}
            disabled={!isAvailable || !docContent || docContent.length < 50}
          >
            Get Suggestions
          </Button>

          {suggestions.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Suggested Documents</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{suggestion.docId}</p>
                        {suggestion.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {(suggestion.relevance * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Client Status:</strong> {client ? "✅ Initialized" : "❌ Not initialized"}
          </p>
          <p>
            <strong>Vector DB:</strong> {isAvailable ? "✅ Available" : "❌ Not available"}
          </p>
          <p className="text-muted-foreground mt-4">
            💡 <strong>Note:</strong> This test page uses mock embeddings for development.
            In production, configure an OpenAI API key for real semantic search capabilities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
