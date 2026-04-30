package app.aichatworkspace.example.domain

data class DomainContext(
    val dataSpaceId: String,
    val json: String,
)

data class DomainApplyResult(
    val checkpointId: String?,
    val operationPreview: List<String>,
)

interface DomainAdapter {
    val type: String
    fun buildContext(dataSpaceId: String): DomainContext
    fun operationSchema(): Map<String, Any?>
    fun promptRules(): String
    fun previewOperations(operations: List<Map<String, Any?>>): List<String>
    fun applyOperations(dataSpaceId: String, operations: List<Map<String, Any?>>): DomainApplyResult
}

