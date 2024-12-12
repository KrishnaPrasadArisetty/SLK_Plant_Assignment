require(["DS/DataDragAndDrop/DataDragAndDrop", "DS/PlatformAPI/PlatformAPI", "DS/WAFData/WAFData", "DS/i3DXCompassServices/i3DXCompassServices","Plant/script/table"], 
	function(DataDragAndDrop, PlatformAPI, WAFData, BaseUrl,whereUsedTable) {
		
		var urlBASE,csrfToken,securityContext;
		
		securityContext= "ctx%3A%3AVPLMProjectLeader.BU-0000001.Micro%20Motion",
		urlBASE = "";

		var comWidget = {

			onLoad: function() { 
								
				// Create a dropbox for drag-and-drop functionality
				var dropbox = widget.createElement('div', { 'class' : 'mydropclass', 'text' : ''});
				var dropimage = widget.createElement('img', { 'src': 'https://krishnaprasadarisetty.github.io/SLK_Boss_ATT/BO_ATT/Images/dropImage.png', 'alt': 'Dropbox Image' });
				dropbox.append(dropimage);
				var dropboxsep = widget.createElement('div', { 'class' : 'dropboxsep', 'text' : '-- or --' });
				dropboxsep.style= "font-size: 12px; color: #d5e8f2; text-align: center";
				dropbox.append(dropboxsep);
				var button = document.createElement('button', {'class':'dynamic-button'});

				button.style = "padding: 10px 20px; font-size: 14px; text-align: center; margin: 10px; background-color: #368ec4; color: white; border: none; cursor: pointer";
				button.innerHTML = 'Open content';
				dropbox.append(button);
				dropbox.style = "border:2px #c6c5c5 dashed; margin:10px; padding: 5%; text-align: center";
				widget.body.innerHTML="";
				dropbox.inject(widget.body);
				//
				comWidget.setBaseURL();

				// Set up drag-and-drop functionality
				var theInput = widget.body.querySelector('.mydropclass');
				DataDragAndDrop.droppable(theInput, {
					drop: function(data) {
						const objs = JSON.parse(data);
						let objList = objs.data.items;
						let objsLength = objList.length;
						if (objsLength > 1) {
							alert("Please drop only one Product.");
							return;
						}
						const PartId = objList[0].objectId;
						const ProductType = objList[0].objectType;
						if ("VPMReference"!=ProductType) {
							alert("Please drop only Products");
							return;
						}
						console.log("PartId dropped:", PartId);	
						var dataResp3 = comWidget.getPartDetails(PartId);
						console.log("dataResp3---->", dataResp3);
						
						let partName = dataResp3.member[0].name;
						let partTitle = dataResp3.member[0].title;
						let partCollabSpace  = dataResp3.member[0].collabspace;
						console.log("partName---->", partName);
						console.log("partTitle---->", partTitle);
						comWidget.partDropped(PartId,partName,partTitle,partCollabSpace);
						
						

						
					},
				});
			},
			AddPlantPopup : function(mainDiv){
				const popup = widget.createElement('div');
				popup.id = 'popup';
				popup.classList.add('popup');

				const popupContent = widget.createElement('div');
				popupContent.classList.add('popup-content');
				popup.style =  "display: none; position: fixed; top: 20px; right: -250px; width: 250px; height: 200px; background-color: white;border: 1px solid #ccc;box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);transition: right 0.3s ease ";
				const closePopupBtn = widget.createElement('span');
				closePopupBtn.id = 'closePopupBtn';
				closePopupBtn.classList.add('close');
				closePopupBtn.innerHTML = '&times;';

				const popupTitle = widget.createElement('h3');
				popupTitle.innerText = 'Avaliable Plants';

				const popupParagraph = widget.createElement('p');
				popupParagraph.innerText = 'This is a small popup that appears on the right of the screen.';

				popupContent.appendChild(closePopupBtn);
				popupContent.appendChild(popupTitle);
				popupContent.appendChild(popupParagraph);
				popup.appendChild(popupContent);
				container.appendChild(popup);

			},
			callwebService: function(methodWAF,urlObjWAF,data) 
			{
				var headerWAF = {
					SecurityContext: securityContext,
					Accept: "application/json",
					ENO_CSRF_TOKEN : csrfToken,
					"Content-Type": "application/json"
				};
				console.log("headerWAF----"+headerWAF);
				let returnobj = {};
				let dataResp=WAFData.authenticatedRequest(urlObjWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: data,
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						returnobj.status = true;
						returnobj.output = dataResp;
						console.log("kp--CallWebService--- >> ",dataResp);
					},
					onFailure: function(error, backendresponse, response_hdrs) {
						console.log("Failedddddd",error.message);
						returnobj.status = false;
						console.log(response_hdrs);
						widget.body.innerHTML += "<p>Something Went Wrong"+error+"</p>";
					}
				})
				
				return returnobj;
			},
			exportTable: function(filename){
				
				let csvContent = "TESTTTTTTTT";
				const rows = parttable.rows;
				/*
				for (let i =0; i<rows.lenght; i++) {
					const row = rows[i];
					const rowData = [];
					for (let j =0; j<rows.lenght; j++){
						rowData.push(row.cell[j].innerHTML);
					}
					csvContent += rowData.join() + '/n';
				}
					*/
				//Create Download link
				let hiddenElement = widget.createElement('a');
				hiddenElement.href = 'data:text/csv/charset=utf-8,' + encodeURI(csvContent);
				hiddenElement.target = '_blank';
				hiddenElement.download = filename;
				hiddenElement.click();
			},
			
			setBaseURL: function() 
			{
				BaseUrl.getServiceUrl( { 
					platformId:  widget.getValue('x3dPlatformId'),
					serviceName: '3DSpace', 
					onComplete :  function (URLResult) {
						urlBASE = URLResult+"/";
						//urlBASE = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/";
						console.log("aaaaaaaaaaaaaaaaa-1111-----URL",urlBASE);
						comWidget.setCSRF();
					},
					onFailure:  function( ) { alert("Something Went Wrong");
					}
				}) ; 
			},
	
			setCSRF: function() {
				console.log("aaaaaaaaaaaaaaaaa-2222-----URL");
				// Web Service call to get the crsf token (security) for the current session
				let urlWAF = urlBASE+"resources/v1/application/CSRF";
				let dataWAF = {};
				let headerWAF = {};
				let methodWAF = "GET";
				let dataResp=WAFData.authenticatedRequest(urlWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: dataWAF,
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						// Save the CSRF token to a hidden widget property so it can be recalled
						let csrfArr=dataResp["csrf"];
						csrfToken = csrfArr["value"];
						console.log("aaaaaaaaaaaaaaaaa------csrfToken",csrfToken);
					},
					onFailure: function(error) {
						widget.body.innerHTML += "<p>Something Went Wrong- "+error+"</p>";
						widget.body.innerHTML += "<p>" + JSON.stringify(error) + "</p>";
					}
				});
			},
			getPartDetails: function(PartId) 
			{
				var headerWAF = {
					ENO_CSRF_TOKEN: csrfToken,
					//SecurityContext: "ctx%3A%3AVPLMProjectLeader.BU-0000001.Rosemount%20Flow",
					SecurityContext: securityContext,
					Accept: "application/json",
					'Content-Type': 'application/json'
				};
				var methodWAF = "GET";
				// Web Service for getting Test Case Object Detail
				var urlObjWAF = urlBASE+"resources/v1/modeler/dseng/dseng:EngItem/";
				urlObjWAF += PartId;
				urlObjWAF += "?$mask=dsmveng:EngItemMask.Details";
				var dataRespTC;
				let dataResp=WAFData.authenticatedRequest(urlObjWAF, {
					method: methodWAF,
					headers: headerWAF,
					data: {},
					type: "json",
					async : false,
					onComplete: function(dataResp) {
						dataRespTC=dataResp;
						console.log("getPartDetailsreturn--sss----- >> ",dataRespTC);
								
					},
					onFailure: function(error, backendresponse, response_hdrs) {
						alert(backendresponse.message);
						console.log(backendresponse);
						console.log(response_hdrs);
						widget.body.innerHTML += "<p>Something Went Wrong"+error+"</p>";
					}
				})
				return dataRespTC;
			},
			partDropped: function(sPartId,partName,partTitle,partCollabSpace) { 
				console.log("PartId dropped:", sPartId);
				comWidget.CreateScreen(sPartId,partName,partTitle,partCollabSpace);
			},
			CreateScreen: function(sPartId,partName,partTitle,partCollabSpace) { 
				var container = widget.createElement('div', { 'id' : 'container' });
				var parttable = widget.createElement('table', { 'id' : 'parttable' });
				var mainDiv = widget.createElement('div', { 'id' : 'mainDiv' });
				
				
				var ssubDiv = widget.createElement('div', { 'id' : 'ssubDiv'});
				ssubDiv.style = "display: flex; justify-content: flex-start";

				var AddPlantsbutton = document.createElement('button', {'class':'dynamic-button'});
				AddPlantsbutton.style = "border-radius: 4px; padding: 1px 10px; font-size: 12px; margin: 10px; background-color: #f1f1f1; color: black; border: none; cursor: pointer";
				AddPlantsbutton.innerHTML = "Add Plants";
				AddPlantsbutton.addEventListener('click', () => comWidget.AddPlantPopup(mainDiv));
				ssubDiv.appendChild(AddPlantsbutton);

				var clearbutton = document.createElement('button', {'class':'dynamic-button'});
				clearbutton.style = "border-radius: 4px; padding: 5px 20px; font-size: 12px; text-align: center; margin: 10px; background-color: #368ec4; color: white; border: none; cursor: pointer";
				clearbutton.innerHTML = 'clear';
				clearbutton.addEventListener('click', comWidget.onLoad);
				ssubDiv.appendChild(clearbutton);

				var savebutton = document.createElement('button', {'class':'dynamic-button'});
				savebutton.style = "border-radius: 4px; padding: 5px 20px; font-size: 12px; text-align: center; margin: 10px; background-color: #368ec4; color: white; border: none; cursor: pointer";
				savebutton.innerHTML = 'save';
				ssubDiv.appendChild(savebutton);

				var exportbutton = document.createElement('button', {'class':'dynamic-button'});
				exportbutton.style = "border-radius: 4px; padding: 1px 10px; font-size: 12px; margin: 10px; background-color: #f1f1f1; color: black; border: none; cursor: pointer";
				exportbutton.innerHTML = '<img src= "https://krishnaprasadarisetty.github.io/SLK_Boss_ATT/BO_ATT/Images/exportImage.JPG" alt="Export Icon" /> Export';
				var img = exportbutton.querySelector('img');
				img.style = "height : 20px ";
				exportbutton.addEventListener('click', () => comWidget.exportTable('Part_Spec_BossAtt.csv'));
				ssubDiv.appendChild(exportbutton);

				var MassUpdatebutton = document.createElement('button', {'class':'dynamic-button'});
				MassUpdatebutton.style = "border-radius: 4px; padding: 1px 10px; font-size: 12px; margin: 10px; background-color: #f1f1f1; color: black; border: none; cursor: pointer";
				MassUpdatebutton.innerHTML = "Mass Update";
				ssubDiv.appendChild(MassUpdatebutton);

				//Call part and class table creation functions
				
				comWidget.partTable(sPartId,partName,partTitle,parttable);  // Populate the part table with data

				mainDiv.appendChild(parttable);
				mainDiv.appendChild(ssubDiv);


				comWidget.classTable(sPartId,partCollabSpace,mainDiv);  // Populate the spec table with data


				container.appendChild(mainDiv);
				
				widget.body.innerHTML="";
				widget.body.appendChild(container);
			},
			getLibClassDetails: function(sLibId) {
				let ALLClasses = { "classes": [] };
				//Call web service--
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Library/";
				urlObjWAF += sLibId;
				urlObjWAF += "?$mask=dslib:ExpandClassifiableClassesMask";
				let LibClassDetails =comWidget.callwebService("GET",urlObjWAF,"");
				if(LibClassDetails.status) {
					const lib_Classes = LibClassDetails.output
					if (lib_Classes.member) {
						lib_Classes.member.forEach(library => {
							console.log("Library:", library.name);  // Log the library name
							// Check if the library has ChildClasses
							if (library.ChildClasses && library.ChildClasses.member) {
							library.ChildClasses.member.forEach(childClass => {
								console.log("Child Class:", childClass.title);  // Log the child class name
								// Check for any further nested ChildClasses in each childClass
								if (childClass.ChildClasses && childClass.ChildClasses.member) {
								childClass.ChildClasses.member.forEach(subChildClass => {
									//console.log("Sub Child Class:", subChildClass.title);  // Log the sub-child class name
									//console.log("--ALLClasses.classes-----:", ALLClasses.classes); 
									ALLClasses.classes.push({"id":subChildClass.id,"title":subChildClass.title});
								});
								}
							});
							}
						});
					}
				}
				console.log("ALLClasses:", ALLClasses); 
				return ALLClasses;
			},
			getClassAttributes: function(sClassId) {
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Class/";
				urlObjWAF += sClassId;
				urlObjWAF += "?$mask=dslib:ClassAttributesMask";
				return LibClassDetails =comWidget.callwebService("GET",urlObjWAF,"");
			},
			getAssignedClassDetails: function(sPartId) {
				let urlObjWAF = urlBASE+"resources/v1/collabServices/attributes/op/read";
				let body = {"busIDs": [sPartId]};
				console.log("class details Body -aaa-->", body);
				let  response =comWidget.callwebService("POST",urlObjWAF,JSON.stringify(body));
				if(response.status && response.results) {
					let ClassExtensions = response.results[0].extensions;
					console.log("ClassExtensions---->", JSON.stringify(ClassExtensions));
				}
				return "krishna..";
			},
			classTable: function(sPartId,partCollabSpace,mainDiv) {
				console.log("Creating class table for PartId:", sPartId);
				let ClassTableData = "";
				let ALLClasses = "";
				let AssignedClasses = "";
				//Need to update proper Collbspace anme in future
				//Here searchstr is Library description need to update and fix furthur
				let urlObjWAF = urlBASE+"resources/v1/modeler/dslib/dslib:Library/search?$searchStr=Library_MM";
				let LibDetails =comWidget.callwebService("GET",urlObjWAF,"");
				if(LibDetails.status) {
					const lib_Details = LibDetails.output;
					const sLibId = lib_Details.member[0].id;
					ALLClasses = comWidget.getLibClassDetails(sLibId);
					console.log("ALLClasses---classess--:", ALLClasses.classes); 
				}
				AssignedClasses = comWidget.getAssignedClassDetails(sPartId);

				ClassTableData = [
					{id:1, Plant:"MVO", Seq:"1",Status:"Current",MFG_Change: "MCONAME", MFG_Status: "Create",Change:"CA-000004", ChangeStatus:"In Work", OracleTemplate:"template-003", ERPStatus:"true",ERP_Export:"yes", Lead_Plant:"False", Make_Buy:"make", SortValue:"1"},
					{id:1, Plant:"MMB", Seq:"1",Status:"Current",MFG_Change: "MCONAME", MFG_Status: "Create",Change:"CA-000004", ChangeStatus:"In Work", OracleTemplate:"template-004", ERPStatus:"true",ERP_Export:"yes", Lead_Plant:"False", Make_Buy:"Buy", SortValue:"2"},
				];
				mainDiv.appendChild(whereUsedTable.showTable(ClassTableData));
					
				
			},
	
			partTable: function(sPartId,partName,partTitle,parttable) { 
	
					const headers = ['Part Names', 'Title'];
					headers.forEach(text => {
						const headerCol = document.createElement("th");
						headerCol.innerText = text;
						parttable.appendChild(headerCol);
					});
				
					const head2 = [partName,partTitle];
					head2.forEach(text => {
						const headerCol = document.createElement("th");
						headerCol.innerText = text;
						parttable.appendChild(headerCol);
					});
				
	
			},
			AddProductCard : function (){
			},
			connectBase : function (){
				 
			},
		};
		widget.addEvent('onLoad', comWidget.onLoad);
		widget.addEvent('onRefresh', comWidget.onLoad);
	});