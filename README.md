# Discord-Join-Logger
This bot logs user joins for a server in another channel/server.

## Setup
```
yarn ci
cp .env.example .env
```

Copy and paste your bot's token into `.env`

## Start
```
yarn start
```

## Commands
- `help`: Simple reminder of how to link.
- `link <ServerID>`: The bot must be present in both the server that receives the alerts and the target observed server. This command will start loggin the joins of the server indicated into the channel where the command has been sent.
- `remove <ServerID>`: Removes a server for being watched and deletes the corresponding webhook.
- `alert <ServerID> <RoleID>`: Sets a role to be pinged if the sus grade is over a threashold. Run without a role ID to remove.
