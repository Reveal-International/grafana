# Grafana

## Development

To develop see [https://github.com/revealinternational/grafana/blob/main/contribute/developer-guide.md](https://github.com/revealinternational/grafana/blob/main/contribute/developer-guide.md)

If you want to run on a different port see https://github.com/revealinternational/grafana/blob/main/contribute/developer-guide.md#configure-grafana-for-development

Create a conf/custom.ini like below to make it start on port 31000

```ini 
app_mode = development

[server]
http_port = 31000
```

Effectively you run the front end in one terminal and back end in the other.
They automatically pick up changes and recompile.

Menu structures are hard-coded in go.
All backend api calls currently are in go.

## Key components
* Menu items ```pkg/api/index.go```
* Routes ```public/app/routes/routes.tsx``` which point at features urls
* Global types ```public/app/types/index.ts```
* Global redux reducers ```public/app/core/reducers/root.ts```
* Global redux state ```public/app/types/store.ts```
* Welcome plugin panel ```public/app/plugins/panel/welcome```
* Features dirs ```public/app/features```
* User lists ```public/app/features/admin/UserListAdminPage.tsx```
* New feeds feature ```public/app/features/feeds```

## Adding a new feature
Check the new feature feed work to see what to update.

1. Add new type in ```public/app/types```
1. Add new type to global types ```public/app/types/index.ts```
1. Add to global routes ```public/app/routes/routes.tsx```
1. Add to global menu ```pkg/api/index.go```
1. Create feature with pages state (reducers, actions, selectors)
1. Add state to global state ```public/app/types/store.ts```
1. Add reducer to global reducers ```public/app/core/reducers/root.ts```

