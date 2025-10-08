import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Code, Shield, Zap, DollarSign } from 'lucide-react';

const CREATE_RULE = gql`
  mutation CreateRule($input: CreateRuleInput!) {
    createRule(input: $input) {
      id
      name
      type
      enabled
    }
  }
`;

interface RuleFormData {
  name: string;
  type: 'access' | 'trigger' | 'royalty';
  documentId: string;
  condition: string;
  action: string;
}

export default function ProgrammableDataPage() {
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    type: 'access',
    documentId: '',
    condition: '{}',
    action: '{}',
  });

  const [createRule, { loading: creating }] = useMutation(CREATE_RULE);

  const ruleTypes = [
    {
      value: 'access',
      label: 'Access Control',
      icon: Shield,
      description: 'Control who can read or modify data',
      exampleCondition: JSON.stringify({ userRole: 'premium' }, null, 2),
      exampleAction: JSON.stringify({ allow: 'read' }, null, 2),
    },
    {
      value: 'trigger',
      label: 'Auto-Trigger',
      icon: Zap,
      description: 'Execute actions when data changes',
      exampleCondition: JSON.stringify({ event: 'document.updated' }, null, 2),
      exampleAction: JSON.stringify({ notify: 'collaborators', updateIndex: true }, null, 2),
    },
    {
      value: 'royalty',
      label: 'Royalty Distribution',
      icon: DollarSign,
      description: 'Automatically distribute payments',
      exampleCondition: JSON.stringify({ event: 'document.accessed', threshold: 1000 }, null, 2),
      exampleAction: JSON.stringify({ distribute: { author: 70, platform: 30 } }, null, 2),
    },
  ];

  const selectedType = ruleTypes.find((t) => t.value === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const input = {
        documentId: formData.documentId,
        name: formData.name,
        type: formData.type,
        condition: JSON.parse(formData.condition),
        action: JSON.parse(formData.action),
      };

      await createRule({ variables: { input } });

      alert('Rule created successfully!');
      // Reset form
      setFormData({
        name: '',
        type: 'access',
        documentId: '',
        condition: '{}',
        action: '{}',
      });
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule: ' + (error as Error).message);
    }
  };

  const loadExample = () => {
    if (selectedType) {
      setFormData({
        ...formData,
        condition: selectedType.exampleCondition,
        action: selectedType.exampleAction,
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Programmable Data</h1>
        <p className="text-muted-foreground">
          Create rules to control access, trigger actions, and distribute royalties automatically
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Premium Access Only"
              required
            />
          </div>

          {/* Document ID */}
          <div className="space-y-2">
            <Label htmlFor="documentId">Document ID</Label>
            <Input
              id="documentId"
              value={formData.documentId}
              onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
              placeholder="Enter document ID"
              required
            />
          </div>

          {/* Rule Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Rule Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rule type" />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground">{selectedType.description}</p>
            )}
          </div>

          {/* Load Example */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadExample}
            className="w-full"
          >
            <Code className="h-4 w-4 mr-2" />
            Load Example Configuration
          </Button>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition (JSON)</Label>
            <Textarea
              id="condition"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder="Enter condition as JSON"
              className="font-mono text-sm min-h-[120px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Define when this rule should be evaluated
            </p>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label htmlFor="action">Action (JSON)</Label>
            <Textarea
              id="action"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              placeholder="Enter action as JSON"
              className="font-mono text-sm min-h-[120px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Define what should happen when the condition is met
            </p>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? 'Creating Rule...' : 'Create Programmable Data Rule'}
          </Button>
        </form>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {ruleTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.value} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{type.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
