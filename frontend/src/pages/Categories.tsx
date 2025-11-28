import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DeleteDialog from "@/components/DeleteDialog";

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryColor, setCategoryColor] = useState("#929292ff");
  const [deleteOpen, setDeleteOpen] = useState(false);


  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");

      const formatted = response.data.data.map((c: any) => ({
        id: c._id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: c.isDefault,
      }));

      setCategories(formatted);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitDefaults = async () => {
    try {
      await api.post("/api/categories/init-defaults");
      toast({ title: "Default categories initialized" });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to initialize defaults",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryIcon.trim()) {
      toast({
        title: "Icon missing",
        description: "Please add an emoji icon.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        // UPDATE CATEGORY
        await api.put(`/api/categories/${editingCategory.id}`, {
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
        });
        toast({ title: "Category updated" });
      } else {
        // CREATE NEW CATEGORY
        await api.post("/api/categories", {
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
        });
        toast({ title: "Category created" });
      }

      setDialogOpen(false);
      setCategoryName("");
      setCategoryIcon("");
      setCategoryColor("#000000");
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/categories/${id}`);
      toast({ title: "Category deleted" });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryIcon("");
    setCategoryColor("#F97316"); // default orange
    setDialogOpen(true);
  };

  const openEditDialog = (cat: any) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon);
    setCategoryColor(cat.color);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">
              Manage expense categories
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <Button variant="outline" onClick={handleInitDefaults}>
              Initialize Defaults
            </Button>

            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* CATEGORY GRID */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Card
              key={c.id}
              style={{
                backgroundColor: c.color + "15",
                borderColor: c.color + "55",
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span>
                  {c.name}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  {!c.isDefault ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(c)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                        setSelectedCategoryId(c.id);
                        setDeleteOpen(true);
                      }}

                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Default
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* NO CATEGORIES */}
        {categories.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No categories found. Initialize defaults or create your own!
          </div>
        )}

        {/* CREATE / EDIT CATEGORY DIALOG */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create Category"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NAME */}
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Pet Care"
                  required
                />
              </div>

              {/* ICON EMOJI */}
              <div className="space-y-2">
                <Label>Emoji Icon</Label>
                <Input
                  value={categoryIcon}
                  onChange={(e) => {
                    const text = [...e.target.value];  // spread handles unicode properly
                    if (text.length <= 3) setCategoryIcon(e.target.value);
                  }}

                  placeholder="e.g., 🐕"
                  required
                />
              </div>

              {/* COLOR PICKER */}
              <div className="space-y-2">
                <Label>Category Color</Label>
                <Input
                  type="color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        loading={false}
        onConfirm={async () => {
          if (!selectedCategoryId) return;

          await handleDelete(selectedCategoryId);
          
          setDeleteOpen(false);
          setSelectedCategoryId(null);
          fetchCategories();
        }}
      />

    </DashboardLayout>
  );
};

export default Categories;
