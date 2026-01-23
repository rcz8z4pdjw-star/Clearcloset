'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Save } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
}

interface UpdateProfileFormProps {
  user: User;
}

export function UpdateProfileForm({ user }: UpdateProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    bio: user.bio || '',
    linkedinUrl: user.linkedinUrl || '',
    twitterHandle: user.twitterHandle || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-xl bg-ascent-navy text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-ascent-navy text-white flex items-center justify-center hover:bg-ascent-navy/90 transition-colors"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div>
          <p className="font-medium">Profile Photo</p>
          <p className="text-sm text-muted-foreground">
            JPG, GIF or PNG. 1MB max.
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">
            Contact an administrator to change your email
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell us a little about yourself..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Brief description for your profile. Max 500 characters.
        </p>
      </div>

      {/* Social Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitterHandle">Twitter Handle</Label>
          <Input
            id="twitterHandle"
            name="twitterHandle"
            value={formData.twitterHandle}
            onChange={handleChange}
            placeholder="@username"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Changes
      </Button>
    </form>
  );
}
