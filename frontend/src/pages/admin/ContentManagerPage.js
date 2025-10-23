import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Plus, FileText, Eye, Trash2, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContentManagerPage = () => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/content/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      toast.error('Failed to load pages');
    }
  };

  const fetchPageContent = async (pageId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/content/pages/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPageContent(response.data);
      setSelectedPage(pageId);
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      toast.error('Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionKey, value) => {
    setPageContent(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: value
      }
    }));
  };

  const handleAddSection = () => {
    const sectionKey = prompt('Enter section key (e.g., "new_section_title"):');
    if (sectionKey && sectionKey.trim()) {
      handleSectionChange(sectionKey.trim(), '');
      toast.success('New section added! Enter content and save.');
    }
  };

  const handleDeleteSection = (sectionKey) => {
    if (confirm(`Delete section "${sectionKey}"?`)) {
      const newSections = { ...pageContent.sections };
      delete newSections[sectionKey];
      setPageContent(prev => ({
        ...prev,
        sections: newSections
      }));
      toast.success('Section deleted! Click Save to apply changes.');
    }
  };

  const handleSave = async () => {
    if (!pageContent) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/content/pages/${pageContent.page_id}`,
        {
          page_id: pageContent.page_id,
          page_name: pageContent.page_name,
          sections: pageContent.sections,
          meta: pageContent.meta || {}
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`✅ ${pageContent.page_name} saved successfully!`);
      fetchPages(); // Refresh pages list
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Failed to save page content');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default pages? This will create Home, About, Contact, and Terms pages.')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/content/initialize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      fetchPages();
    } catch (error) {
      console.error('Failed to initialize:', error);
      toast.error('Failed to initialize default pages');
    }
  };

  const formatSectionKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6" data-testid="content-manager-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Manager</h2>
          <p className="text-gray-600">Edit page content across your website</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInitializeDefaults} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Initialize Defaults
          </Button>
          <Button onClick={handleAddSection} variant="outline" size="sm" disabled={!pageContent}>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar - Pages List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pages</CardTitle>
              <CardDescription>Select a page to edit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pages.length === 0 ? (
                <p className="text-sm text-gray-500">No pages found. Click "Initialize Defaults" to create pages.</p>
              ) : (
                pages.map((page) => (
                  <Button
                    key={page.page_id}
                    onClick={() => fetchPageContent(page.page_id)}
                    variant={selectedPage === page.page_id ? "default" : "outline"}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {page.page_name}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Editor */}
        <div className="md:col-span-3">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p>Loading page content...</p>
              </CardContent>
            </Card>
          ) : pageContent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{pageContent.page_name}</CardTitle>
                    <CardDescription>
                      Last updated: {pageContent.updated_at ? new Date(pageContent.updated_at).toLocaleString() : 'Never'}
                    </CardDescription>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Page Name */}
                <div>
                  <Label className="text-base font-semibold">Page Name</Label>
                  <Input
                    value={pageContent.page_name}
                    onChange={(e) => setPageContent({ ...pageContent, page_name: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Sections */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Page Sections</h3>
                  {Object.entries(pageContent.sections).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-semibold text-indigo-700">
                          {formatSectionKey(key)}
                        </Label>
                        <Button
                          onClick={() => handleDeleteSection(key)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Key: {key}</p>
                      {typeof value === 'string' && value.length > 100 ? (
                        <Textarea
                          value={value}
                          onChange={(e) => handleSectionChange(key, e.target.value)}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <Input
                          value={value}
                          onChange={(e) => handleSectionChange(key, e.target.value)}
                          className="font-mono text-sm"
                        />
                      )}
                    </div>
                  ))}

                  {Object.keys(pageContent.sections).length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No sections yet. Click "Add Section" to create one.
                    </p>
                  )}
                </div>

                {/* Meta Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Meta Information (SEO)</h3>
                  <div>
                    <Label>Page Title (Browser Tab)</Label>
                    <Input
                      value={pageContent.meta?.title || ''}
                      onChange={(e) => setPageContent({
                        ...pageContent,
                        meta: { ...pageContent.meta, title: e.target.value }
                      })}
                      placeholder="e.g., About Us - Vaishnavi Printers"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={pageContent.meta?.description || ''}
                      onChange={(e) => setPageContent({
                        ...pageContent,
                        meta: { ...pageContent.meta, description: e.target.value }
                      })}
                      placeholder="e.g., Learn more about Vaishnavi Printers..."
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Save Button at Bottom */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700" size="lg">
                    <Save className="w-5 h-5 mr-2" />
                    {saving ? 'Saving Changes...' : 'Save All Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Page Selected</h3>
                <p className="text-gray-500">Select a page from the sidebar to start editing</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentManagerPage;
