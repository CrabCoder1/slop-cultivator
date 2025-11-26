# Supabase MCP Token Refresh Guide

## Problem

When your Supabase access token expires (typically after 30 days), Kiro's MCP Supabase integration will fail with authentication errors. You'll see error messages indicating the MCP server cannot connect to your Supabase project.

## Solution

Follow these steps to refresh your Supabase access token:

### 1. Generate a New Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new access token (or use an existing one)
3. Copy the token

### 2. Update the Environment Variable

Open a terminal and run:

```bash
setx SUPABASE_DB_TOKEN "your-new-token-here"
```

Replace `your-new-token-here` with the actual token you copied.

### 3. Restart Kiro

**Important**: After setting the environment variable, you MUST restart Kiro for it to pick up the new token value.

1. Close Kiro completely
2. Reopen Kiro
3. The MCP Supabase connection should now work

## Verification

To verify the connection is working:

1. Try using any Supabase MCP tool (e.g., list tables, execute SQL)
2. If you still see authentication errors, check that:
   - The token was copied correctly (no extra spaces)
   - Kiro was fully restarted
   - The environment variable was set correctly (run `echo %SUPABASE_DB_TOKEN%` to verify)

## Troubleshooting

If the connection still fails after following these steps:

1. **Check token validity**: Ensure the token hasn't been revoked in the Supabase dashboard
2. **Verify environment variable**: Run `echo %SUPABASE_DB_TOKEN%` to confirm it's set
3. **Check MCP configuration**: Open `.kiro/settings/mcp.json` and verify the Supabase server is enabled
4. **Reconnect MCP server**: In Kiro, open the MCP Server view and manually reconnect the Supabase server

## Prevention

To avoid this issue in the future:

- Set a calendar reminder a few days before your token expires
- Consider generating tokens with longer expiration periods if available
- Keep a backup token ready for quick rotation
