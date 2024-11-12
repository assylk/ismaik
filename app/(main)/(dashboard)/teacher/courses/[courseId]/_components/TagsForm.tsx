"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FaPencilAlt } from "react-icons/fa";
import { MdOutlineCancel } from "react-icons/md";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BiLoader } from "react-icons/bi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"; // You'll need to create or import a Badge component
import { X } from "lucide-react"; // For delete icon
import { motion, AnimatePresence } from "framer-motion"; // Add this import
import { Search } from "lucide-react"; // Add this import

interface TagsFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  tag: z.string()
    .min(1, "Tag is required")
    .max(20, "Tag must be less than 20 characters")
    .refine(val => /^[a-zA-Z0-9-\s]+$/.test(val), {
      message: "Tag can only contain letters, numbers, spaces and hyphens"
    })
});

const TagsForm = ({ initialData, courseId }: TagsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const toggleEdit = () => setIsEditing((current) => !current);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag: ""
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && form.formState.isValid && !isSubmitting) {
      event.preventDefault();
      const values = form.getValues();
      onSubmit(values);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const normalizedTag = values.tag.trim().toLowerCase();
      if (tags.map(t => t.toLowerCase()).includes(normalizedTag)) {
        toast.error("This tag already exists!");
        return;
      }
      const newTags = [...tags, values.tag.trim()];
      await axios.patch(`/api/courses/${courseId}`, { tags: newTags });
      setTags(newTags);
      toast.success("Tag added!");
      form.reset();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const removeTag = async (tagToRemove: string) => {
    try {
      const newTags = tags.filter(tag => tag !== tagToRemove);
      await axios.patch(`/api/courses/${courseId}`, { tags: newTags });
      setTags(newTags);
      toast.success("Tag removed!");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="border bg-accent/50 dark:bg-accent/20 rounded-lg p-4 shadow-sm">
      <div className="font-medium text-lg flex items-start justify-between mb-4">
        <span className="flex items-center justify-center gap-2">
          {isSubmitting && <BiLoader className="animate-spin w-5 h-5" />}
          <span>Course Tags</span>
        </span>
        <Button variant="ghost" onClick={toggleEdit}>
          {isEditing ? (
            <>
              <MdOutlineCancel className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <FaPencilAlt className="h-4 w-4 mr-2" />
              Edit Tags
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {tags.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 focus:bg-background transition-colors shadow-sm"
            />
          </div>
        )}

        {isEditing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2">
              <FormField
                control={form.control}
                name="tag"
                render={({field}) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="Add a tag... (press Enter)"
                        onKeyDown={handleKeyDown}
                        className="bg-background/50 focus:bg-background transition-colors shadow-sm hover:bg-background/70"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                disabled={!isValid || isSubmitting}
                type="submit"
                className="bg-primary hover:bg-primary/90 whitespace-nowrap shadow-sm"
              >
                Add Tag
              </Button>
            </form>
          </Form>
        )}

        <AnimatePresence>
          <div className="flex flex-wrap gap-2">
            {filteredTags.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                {tags.length === 0 ? "No tags added" : "No matching tags found"}
              </p>
            ) : (
              filteredTags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 shadow-sm",
                      "hover:bg-accent/60 hover:scale-105 transition-all duration-200",
                      "cursor-default border border-border/50"
                    )}
                  >
                    {tag}
                    {isEditing && (
                      <button 
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:opacity-75 transition-opacity rounded-full hover:bg-background/50 p-0.5"
                        aria-label="Remove tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TagsForm; 