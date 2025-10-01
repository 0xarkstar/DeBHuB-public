'use client';

import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Search, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEARCH_DOCUMENTS } from '@/lib/graphql/queries';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchDocuments, { data, loading, called }] = useLazyQuery(SEARCH_DOCUMENTS);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchDocuments({
        variables: {
          query: query.trim(),
          limit: 20,
        },
      });
    }
  };

  const results = data?.searchDocuments || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Documents</h1>
        <p className="text-muted-foreground">
          Search across all your documents with full-text search
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for documents, content, tags..."
          className="pl-12 pr-24 h-14 text-base"
        />
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : called && results.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search query or search for different keywords
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
          </div>

          {results.map((result: any) => (
            <Card key={result.documentId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Link href={`/documents/${result.documentId}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                        {result.title}
                      </h3>

                      {/* Highlights */}
                      {result.highlights && result.highlights.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {result.highlights.slice(0, 2).map((highlight: string, idx: number) => (
                            <p
                              key={idx}
                              className="text-sm text-muted-foreground line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: highlight.replace(
                                  new RegExp(`(${query})`, 'gi'),
                                  '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                ),
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
                        </div>
                        {result.metadata?.projectName && (
                          <>
                            <span>•</span>
                            <span>Project: {result.metadata.projectName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Start searching</h3>
          <p className="text-muted-foreground">
            Enter keywords to search across all your documents
          </p>
        </div>
      )}
    </div>
  );
}
