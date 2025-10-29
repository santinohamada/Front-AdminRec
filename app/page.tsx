import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, Users, Package, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-balance">Resource Management System</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Centralized platform for managing projects, team members, and company resources with complete CRUD
              operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border hover:border-primary transition-colors">
              <CardHeader>
                <FolderKanban className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Projects</CardTitle>
                <CardDescription>Manage all company projects with assigned team members and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button variant="ghost" className="w-full justify-between group">
                    View Projects
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Team</CardTitle>
                <CardDescription>Manage team members, roles, and project assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/team">
                  <Button variant="ghost" className="w-full justify-between group">
                    View Team
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors">
              <CardHeader>
                <Package className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Resources</CardTitle>
                <CardDescription>Track and manage company resources and their allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/resources">
                  <Button variant="ghost" className="w-full justify-between group">
                    View Resources
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          
        </div>
      </div>
    </div>
  )
}
