'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateDailyHustleIdeas } from '@/ai/flows/generate-daily-hustle-ideas';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, CheckSquare, Trash2, Loader2 } from 'lucide-react';

const formSchema = z.object({
  userSkills: z.string().min(1, { message: 'Please enter at least one skill.' }),
});

type FormData = z.infer<typeof formSchema>;

interface Idea {
  id: string;
  text: string;
}

export default function Home() {
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSkills: '',
    },
  });

  // Load saved ideas from localStorage on component mount
  useEffect(() => {
    const storedIdeas = localStorage.getItem('savedHustleIdeas');
    if (storedIdeas) {
      try {
        setSavedIdeas(JSON.parse(storedIdeas));
      } catch (error) {
        console.error("Failed to parse saved ideas from localStorage", error);
        localStorage.removeItem('savedHustleIdeas'); // Clear corrupted data
      }
    }
  }, []);

  // Save ideas to localStorage whenever savedIdeas state changes
  useEffect(() => {
    if (savedIdeas.length > 0) {
      localStorage.setItem('savedHustleIdeas', JSON.stringify(savedIdeas));
    } else {
       // Clear localStorage if no ideas are saved to prevent storing empty array string
       localStorage.removeItem('savedHustleIdeas');
    }
  }, [savedIdeas]);


  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setGeneratedIdeas([]); // Clear previous ideas
    try {
      const result = await generateDailyHustleIdeas({ userSkills: values.userSkills });
      if (result && result.ideas) {
        const newIdeas = result.ideas.map((idea, index) => ({
          id: `gen-${Date.now()}-${index}`, // Simple unique ID
          text: idea,
        }));
        setGeneratedIdeas(newIdeas);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate ideas. No ideas returned.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while generating ideas. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

   const saveIdea = (ideaToSave: Idea) => {
    if (!savedIdeas.some(idea => idea.id === ideaToSave.id)) {
      setSavedIdeas(prev => [...prev, ideaToSave]);
      // Remove from generated list if needed, or just show feedback
      // setGeneratedIdeas(prev => prev.filter(idea => idea.id !== ideaToSave.id));
      toast({
        title: 'Idea Saved',
        description: `"${ideaToSave.text.substring(0, 30)}..." saved successfully.`,
        variant: 'default', // Use default variant instead of success
      });
    } else {
      toast({
        title: 'Already Saved',
        description: 'This idea is already in your saved list.',
        variant: 'default', // Use default variant
      });
    }
  };

  const removeSavedIdea = (idToRemove: string) => {
    setSavedIdeas(prev => prev.filter(idea => idea.id !== idToRemove));
    toast({
      title: 'Idea Removed',
      description: 'The idea has been removed from your saved list.',
       variant: 'default', // Use default variant
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-secondary">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Daily Hustle Generator</CardTitle>
          <CardDescription>Find ways to earn an extra $3 a day!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., writing, graphic design, social media" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter some skills you have (comma-separated).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  'Generate Ideas'
                )}
              </Button>
            </form>
          </Form>

          {generatedIdeas.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><List className="mr-2 h-5 w-5" /> Generated Ideas</h2>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background">
                <ul className="space-y-2">
                  {generatedIdeas.map((idea) => (
                    <li key={idea.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span>{idea.text}</span>
                       <Button variant="ghost" size="sm" onClick={() => saveIdea(idea)} className="text-accent hover:text-accent-foreground hover:bg-accent/10">
                        <CheckSquare className="h-4 w-4" />
                        <span className="sr-only">Save Idea</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {savedIdeas.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><CheckSquare className="mr-2 h-5 w-5 text-accent" /> Saved Ideas</h2>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background">
                <ul className="space-y-2">
                  {savedIdeas.map((idea) => (
                    <li key={idea.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span>{idea.text}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeSavedIdea(idea.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Remove Idea</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
