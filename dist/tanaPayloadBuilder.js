import { sanitizeText, splitIntoChunks } from './utils/textUtils';
/**
 * Build a Tana API payload using the extracted schema and content data.
 * @param data - The content data (url, title, author, description, content)
 * @param targetNodeId - The Tana node to save under
 * @param supertagId - The supertag ID for the node
 * @param fieldIds - Mapping of field names to attribute IDs
 * @returns Tana API payload
 */
export function buildTanaPayload(data, targetNodeId, supertagId, fieldIds) {
    // Validate required parameters
    if (!data) {
        throw new Error('SaveData is required');
    }
    if (!targetNodeId || !targetNodeId.trim()) {
        throw new Error('Valid targetNodeId is required');
    }
    if (!supertagId || !supertagId.trim()) {
        throw new Error('Valid supertagId is required');
    }
    if (!fieldIds) {
        throw new Error('TanaFieldIds is required');
    }
    // Build the main node
    const mainNode = {
        name: sanitizeText(data.title || data.url),
        supertags: [{ id: supertagId }],
        children: []
    };
    // Add URL field
    if (data.url && fieldIds.URL) {
        mainNode.children.push({
            type: 'field',
            attributeId: fieldIds.URL,
            children: [{ dataType: 'url', name: data.url }]
        });
    }
    // Add Author field
    if (data.author && fieldIds.Author) {
        mainNode.children.push({
            type: 'field',
            attributeId: fieldIds.Author,
            children: [{ name: sanitizeText(data.author) }]
        });
    }
    // Add Description field
    if (data.description && fieldIds.Description) {
        mainNode.children.push({
            type: 'field',
            attributeId: fieldIds.Description,
            children: [{ name: sanitizeText(data.description) }]
        });
    }
    // Add Content field (chunked if needed)
    if (data.content && fieldIds.Content) {
        const sanitizedContent = sanitizeText(data.content);
        const maxContentLength = 4000;
        let contentChunks = [];
        if (sanitizedContent.length > maxContentLength) {
            contentChunks = splitIntoChunks(sanitizedContent, maxContentLength)
                .map(chunk => ({ name: chunk }));
        }
        else {
            contentChunks = [{ name: sanitizedContent }];
        }
        mainNode.children.push({
            type: 'field',
            attributeId: fieldIds.Content,
            children: contentChunks
        });
    }
    return {
        targetNodeId,
        nodes: [mainNode]
    };
}
//# sourceMappingURL=tanaPayloadBuilder.js.map