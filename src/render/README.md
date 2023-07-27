File->IO(transform)->Core->Render(layout & prepare render)->VUE(render)->UIL(user interactive logic)->Edit->Core->IO(transform)->File
																					|
loop Edit->Core->Render->VUE(render)->UIL(user interactive logic)


MVVM模型
https://docs.microsoft.com/en-us/xamarin/xamarin-forms/enterprise-application-patterns/mvvm
https://pediaa.com/what-is-the-difference-between-mvc-and-mvvm/

Core: Module
Render: Module
UIL: helper for ViewModule
Edit: helper for ViewModule
VUE: ViewModule+View


