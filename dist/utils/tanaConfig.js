function getEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export const tanaConfig = {
    apiKey: getEnvVar('TANA_API_KEY'),
    targetNodeId: getEnvVar('TANA_TARGET_NODE_ID'),
    supertagId: getEnvVar('TANA_SUPERTAG_ID'),
    fieldIdUrl: getEnvVar('TANA_FIELD_ID_URL'),
    fieldIdAuthor: getEnvVar('TANA_FIELD_ID_AUTHOR'),
    fieldIdDescription: getEnvVar('TANA_FIELD_ID_DESCRIPTION'),
    fieldIdContent: getEnvVar('TANA_FIELD_ID_CONTENT'),
};
//# sourceMappingURL=tanaConfig.js.map