import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileJson, Zap } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';

import { usePureIrys } from '@/contexts/PureIrysContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Data templates
const TEMPLATES = {
  blank: {
    name: 'Blank',
    description: 'Start with an empty object',
    content: {},
  },
  project: {
    name: 'Project',
    description: 'Project structure',
    content: {
      name: '',
      description: '',
      slug: '',
      visibility: 'private',
    },
  },
  document: {
    name: 'Document',
    description: 'Document with title and content',
    content: {
      title: '',
      content: '',
      type: 'markdown',
      author: '',
    },
  },
  vector: {
    name: 'Vector Embedding',
    description: 'AI vector data',
    content: {
      docId: '',
      content: '',
      metadata: {},
    },
  },
  gameSave: {
    name: 'Game Save',
    description: 'Game save data',
    content: {
      player: '',
      level: 1,
      score: 0,
      inventory: [],
      position: { x: 0, y: 0, z: 0 },
    },
  },
  iotReading: {
    name: 'IoT Sensor Reading',
    description: 'IoT device data',
    content: {
      deviceId: '',
      sensorType: 'temperature',
      value: 0,
      unit: 'celsius',
      timestamp: Date.now(),
    },
  },
  nftMetadata: {
    name: 'NFT Metadata',
    description: 'NFT metadata structure',
    content: {
      name: '',
      description: '',
      image: '',
      attributes: [],
    },
  },
  custom: {
    name: 'Custom Data',
    description: 'Any custom JSON structure',
    content: {
      // Your custom data here
    },
  },
};

export default function CreateData() {
  const navigate = useNavigate();
  const { client } = usePureIrys();

  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('blank');
  const [jsonContent, setJsonContent] = useState(
    JSON.stringify(TEMPLATES.blank.content, null, 2)
  );
  const [customTags, setCustomTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleTemplateChange = (template: keyof typeof TEMPLATES) => {
    setSelectedTemplate(template);
    setJsonContent(JSON.stringify(TEMPLATES[template].content, null, 2));
    setValidationError('');
  };

  const handleCreate = async () => {
    if (!client) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // Validate JSON
      const parsed = JSON.parse(jsonContent);
      setValidationError('');
      setError(null);

      // Prepare tags as string array
      const tags = [
        `type:${selectedTemplate}`,
        ...customTags.split(',').map(t => t.trim()).filter(Boolean),
      ];

      // Create document
      setIsCreating(true);

      const createPromise = client.createDocument({
        projectId: 'data-console',
        title: title || `${TEMPLATES[selectedTemplate].name} - ${Date.now()}`,
        content: JSON.stringify(parsed), // Convert to string
        tags,
      });

      toast.promise(createPromise, {
        loading: 'Creating data on blockchain...',
        success: 'Data created successfully!',
        error: 'Failed to create data',
      });

      const result = await createPromise;

      if (result?.docId) {
        // Navigate to the created data
        navigate(`/data/${result.docId}`);
      }
    } catch (err) {
      const error = err as Error;
      setValidationError(error.message);
      setError(error);
      toast.error('Error: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(jsonContent);
      setValidationError('');
      toast.success('JSON is valid!');
      return true;
    } catch (err) {
      setValidationError((err as Error).message);
      toast.error('Invalid JSON: ' + (err as Error).message);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/data')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Data Browser
        </Button>
        <h1 className="text-3xl font-bold mt-2 flex items-center gap-3">
          <FileJson className="h-8 w-8" />
          Create New Data
        </h1>
        <p className="text-muted-foreground">
          Create any type of data and store it permanently on Irys DataChain
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <Label className="text-base font-semibold">Select Template</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose a template to get started quickly
              </p>
            </div>

            <div className="space-y-2">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateChange(key as keyof typeof TEMPLATES)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    {selectedTemplate === key && (
                      <Badge variant="default" className="ml-2">Selected</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <Label className="text-base font-semibold">Settings</Label>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="My Data Record"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tags">Custom Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="tag1, tag2, tag3"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated tags for filtering
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public">Public Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this data publicly accessible
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="border rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                What you can store
              </p>
            </div>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Any valid JSON data</li>
              <li>• Game save states</li>
              <li>• IoT sensor readings</li>
              <li>• NFT metadata</li>
              <li>• User preferences</li>
              <li>• Application configuration</li>
              <li>• And much more!</li>
            </ul>
          </div>
        </div>

        {/* Right: JSON Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="font-medium">JSON Content</p>
                <p className="text-xs text-muted-foreground">
                  Edit the JSON structure below
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={validateJson}
              >
                Validate JSON
              </Button>
            </div>

            <Editor
              height="600px"
              language="json"
              value={jsonContent}
              onChange={(value) => {
                setJsonContent(value || '');
                setValidationError('');
              }}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Invalid JSON:</strong> {validationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Create Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error creating data:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Data will be stored permanently on Irys DataChain
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/data')}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !jsonContent}
              >
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Data'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
