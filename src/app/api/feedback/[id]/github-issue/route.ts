import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth-utils"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = "axxes-club/afters"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isSuperAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Get the feedback entry
    const feedback = await prisma.feedback.findUnique({
      where: { id },
    })

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    // Get user info if available
    const user = feedback.userId
      ? await prisma.user.findUnique({
          where: { id: feedback.userId },
          select: { email: true, firstName: true, lastName: true },
        })
      : null

    if (feedback.githubIssueUrl) {
      return NextResponse.json(
        { error: "GitHub issue already exists", url: feedback.githubIssueUrl },
        { status: 400 }
      )
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub integration not configured" },
        { status: 500 }
      )
    }

    // Map feedback type to GitHub labels
    const labels: string[] = []
    if (feedback.type === "bug") {
      labels.push("bug")
    } else if (feedback.type === "feature") {
      labels.push("enhancement")
    }
    labels.push("from-feedback")

    // Build the issue title
    const typeEmoji = feedback.type === "bug" ? "🐛" : feedback.type === "feature" ? "✨" : "💬"
    const title = `${typeEmoji} [Feedback] ${feedback.message.slice(0, 80)}${feedback.message.length > 80 ? "..." : ""}`

    // Build the issue body
    const userInfo = user
      ? `**Submitted by:** ${user.firstName || ""} ${user.lastName || ""} (${user.email})`
      : "**Submitted by:** Anonymous"

    const body = `## Feedback Report

${userInfo}
**Type:** ${feedback.type}
**Date:** ${new Date(feedback.createdAt).toLocaleString()}
${feedback.currentPath ? `**Page:** \`${feedback.currentPath}\`` : ""}

---

### Message

${feedback.message}

---

${feedback.screenshotUrl ? `### Screenshots\n\n${feedback.screenshotUrl.split(",").map((url, i) => `![Screenshot ${i + 1}](${url})`).join("\n\n")}` : ""}

${feedback.adminNotes ? `### Admin Notes\n\n${feedback.adminNotes}` : ""}

---

<sub>Created from feedback ID: \`${feedback.id}\`</sub>
`

    // Create the GitHub issue
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "afters-feedback-bot",
      },
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("GitHub API error:", error)
      return NextResponse.json(
        { error: "Failed to create GitHub issue", details: error.message },
        { status: 500 }
      )
    }

    const issue = await response.json()

    // Update feedback with the issue URL
    await prisma.feedback.update({
      where: { id },
      data: {
        githubIssueUrl: issue.html_url,
        status: feedback.status === "new" ? "reviewed" : feedback.status,
      },
    })

    return NextResponse.json({
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
    })
  } catch (error) {
    console.error("Error creating GitHub issue:", error)
    return NextResponse.json(
      { error: "Failed to create GitHub issue" },
      { status: 500 }
    )
  }
}
