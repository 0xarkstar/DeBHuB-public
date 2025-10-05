import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CREATE_PROJECT } from '@/lib/graphql/mutations';
import { GET_MY_PROJECTS } from '@/lib/graphql/queries';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'UNLISTED',
  });

  const [createProject, { loading, error }] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_MY_PROJECTS, variables: { limit: 50, offset: 0 } }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await createProject({
        variables: {
          input: {
            name: formData.name,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description || undefined,
            visibility: formData.visibility,
            settings: {
              defaultBranch: 'main',
              allowPublicEdit: false,
              enableComments: true,
            },
          },
        },
      });

      if (data?.createProject) {
        navigate(`/projects/${data.createProject.id}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleSlugChange = (value: string) => {
    // Auto-generate slug if it's empty
    if (!formData.slug || formData.slug === formData.name.toLowerCase().replace(/\s+/g, '-')) {
      setFormData({
        ...formData,
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
      });
    } else {
      setFormData({ ...formData, name: value });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Set up a new documentation project on IrysBase
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Enter the basic information for your new project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="My Documentation"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Slug *
              </label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                placeholder="my-documentation"
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used in the URL: /{formData.slug}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of your project..."
                rows={4}
              />
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility *</label>
              <div className="space-y-2">
                {[
                  {
                    value: 'PRIVATE',
                    label: 'Private',
                    description: 'Only you and collaborators can access',
                  },
                  {
                    value: 'UNLISTED',
                    label: 'Unlisted',
                    description: 'Anyone with the link can access',
                  },
                  {
                    value: 'PUBLIC',
                    label: 'Public',
                    description: 'Visible to everyone',
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visibility: e.target.value as any,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {error.message || 'Failed to create project'}
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading || !formData.name || !formData.slug}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
