package com.olintli.api

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/workspaces")
class WorkspaceController {
    @GetMapping
    fun listWorkspaces(): WorkspaceListResponse {
        return WorkspaceListResponse(
            items = listOf(
                WorkspaceSummary(
                    id = "trip-2026-busan",
                    type = "trip",
                    title = "부산 3박 4일",
                    status = "active",
                    updatedAt = "2026-06-02T09:30:00+09:00"
                ),
                WorkspaceSummary(
                    id = "knowledge-agent-platform",
                    type = "knowledge",
                    title = "개인형 Agent Platform 리서치",
                    status = "draft",
                    updatedAt = "2026-06-01T22:10:00+09:00"
                )
            )
        )
    }
}

data class WorkspaceListResponse(
    val items: List<WorkspaceSummary>
)

data class WorkspaceSummary(
    val id: String,
    val type: String,
    val title: String,
    val status: String,
    val updatedAt: String
)
