import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePureIrys } from '@/contexts/PureIrysContext';
import { useCreateDocument } from '@debhub/pure-irys-client';

/**
 * Create New Project using Pure Irys Client
 * Projects are stored as documents with type:project tag
 */

export default function NewProjectPure() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { client } = usePureIrys();
  const { createDocument, isCreating, error: createError } = useCreateDocument(client);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    visibility: 'private' as 'public' | 'private' | 'unlisted',
  });

  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : generateSlug(name)
    }));
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client || !address) {
      return;
    }

    try {
      // Create project as a document with special tags
      const projectData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        visibility: formData.visibility,
        owner: address,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        documents: [],
        collaborators: [address],
      };

      const docId = await createDocument({
        projectId: formData.slug, // Use slug as projectId for grouping
        title: formData.name,
        content: JSON.stringify(projectData),
        tags: ['type:project', `visibility:${formData.visibility}`, `owner:${address}`],
        isPublic: formData.visibility === 'public',
      });

      if (docId) {
        // Navigate to project page
        navigate(`/projects/${formData.slug}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Set up a new documentation project on Pure Irys BaaS
        </p>
      </div>

      {/* Error Alert */}
      {createError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to create project: {createError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 border rounded-lg p-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            placeholder="My Awesome Documentation"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            disabled={isCreating}
          />
          <p className="text-sm text-muted-foreground">
            Choose a descriptive name for your project
          </p>
        </div>

        {/* Project Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Project Slug *</Label>
          <Input
            id="slug"
            placeholder="my-awesome-docs"
            value={formData.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
            }}
            required
            disabled={isCreating}
            pattern="[a-z0-9-]+"
          />
          <p className="text-sm text-muted-foreground">
            URL-friendly identifier (lowercase, hyphens only)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="A comprehensive guide to..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            disabled={isCreating}
          />
          <p className="text-sm text-muted-foreground">
            Optional description to help others understand your project
          </p>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility *</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, visibility: value }))}
            disabled={isCreating}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-sm text-muted-foreground">
                    Anyone can view and search
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="unlisted">
                <div>
                  <div className="font-medium">Unlisted</div>
                  <div className="text-sm text-muted-foreground">
                    Only accessible via direct link
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-sm text-muted-foreground">
                    Only you and collaborators
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blockchain Info */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Pure Irys BaaS
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Stored permanently on Irys DataChain</li>
            <li>✓ Immutable and censorship-resistant</li>
            <li>✓ Indexed via smart contracts</li>
            <li>✓ Zero backend servers required</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating || !formData.name || !formData.slug}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
