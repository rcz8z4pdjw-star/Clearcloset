'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  Sparkles,
  Check,
  Eye,
  Accessibility,
  Volume2,
  Bell,
} from 'lucide-react';

const themes = [
  {
    id: 'light',
    name: 'Light',
    description: 'Classic light theme',
    icon: Sun,
    preview: 'bg-white border-gray-200',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
    preview: 'bg-gray-900 border-gray-700',
  },
  {
    id: 'system',
    name: 'System',
    description: 'Follows your device',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400',
  },
];

const accentColors = [
  { id: 'indigo', color: 'bg-indigo-500', name: 'Indigo' },
  { id: 'blue', color: 'bg-blue-500', name: 'Blue' },
  { id: 'purple', color: 'bg-purple-500', name: 'Purple' },
  { id: 'pink', color: 'bg-pink-500', name: 'Pink' },
  { id: 'green', color: 'bg-green-500', name: 'Green' },
  { id: 'orange', color: 'bg-orange-500', name: 'Orange' },
  { id: 'red', color: 'bg-red-500', name: 'Red' },
  { id: 'yellow', color: 'bg-yellow-500', name: 'Yellow' },
];

const fontSizes = [
  { id: 'small', label: 'Small', value: 14 },
  { id: 'medium', label: 'Medium', value: 16 },
  { id: 'large', label: 'Large', value: 18 },
  { id: 'xlarge', label: 'Extra Large', value: 20 },
];

export default function AppearanceSettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'light',
    accentColor: 'indigo',
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
    soundEffects: true,
    hapticFeedback: true,
    compactMode: false,
    showAnimations: true,
  });

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleAccentChange = (color: string) => {
    setSettings(prev => ({ ...prev, accentColor: color }));
  };

  return (
    <div className="space-y-8 p-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8 text-indigo-500" />
          Appearance
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize how Ascent looks and feels
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isSelected = settings.theme === theme.id;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-border hover:border-indigo-200'
                  }`}
                >
                  {/* Preview */}
                  <div className={`h-20 rounded-lg ${theme.preview} border mb-3`}>
                    <div className="h-full p-2 flex flex-col gap-1">
                      <div className={`h-2 w-12 rounded ${theme.id === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-2 w-8 rounded ${theme.id === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className="flex-1" />
                      <div className={`h-3 w-full rounded ${theme.id === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'}`} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{theme.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Accent Color
          </CardTitle>
          <CardDescription>Choose your favorite accent color for buttons and highlights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => handleAccentChange(color.id)}
                className={`group relative w-12 h-12 rounded-full ${color.color} transition-all hover:scale-110 ${
                  settings.accentColor === color.id
                    ? 'ring-4 ring-offset-2 ring-gray-400'
                    : ''
                }`}
                title={color.name}
              >
                {settings.accentColor === color.id && (
                  <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-500" />
            Text Size
          </CardTitle>
          <CardDescription>Adjust the base font size for better readability</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.fontSize}
            onValueChange={(value) => setSettings(prev => ({ ...prev, fontSize: value }))}
            className="flex flex-wrap gap-4"
          >
            {fontSizes.map((size) => (
              <div key={size.id} className="flex items-center space-x-2">
                <RadioGroupItem value={size.id} id={`font-${size.id}`} />
                <Label
                  htmlFor={`font-${size.id}`}
                  style={{ fontSize: size.value }}
                  className="cursor-pointer"
                >
                  {size.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Preview */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <p style={{ fontSize: fontSizes.find(f => f.id === settings.fontSize)?.value }}>
              The quick brown fox jumps over the lazy dog. Learning about finances is fun!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-green-500" />
            Accessibility
          </CardTitle>
          <CardDescription>Options to improve accessibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and motion effects
              </p>
            </div>
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reduceMotion: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, highContrast: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable fun animations and transitions
              </p>
            </div>
            <Switch
              checked={settings.showAnimations}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAnimations: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound & Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-purple-500" />
            Sound & Feedback
          </CardTitle>
          <CardDescription>Control audio and haptic feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for achievements and actions
              </p>
            </div>
            <Switch
              checked={settings.soundEffects}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEffects: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Haptic Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Vibration feedback on mobile devices
              </p>
            </div>
            <Switch
              checked={settings.hapticFeedback}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hapticFeedback: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-500" />
            Layout
          </CardTitle>
          <CardDescription>Customize the interface layout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for more content on screen
              </p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compactMode: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
