var quizeApp = angular.module('quizeApp', ['ngRoute', 'ngSanitize']);

quizeApp.config(function ($routeProvider) {

	$routeProvider.when('/selectTest', { templateUrl: 'http://sp2013lysov/sites/slavyanka/Shared%20Documents/selectTest.html', controller: 'TestSetCtrl' }).
				   when('/createTest', { templateUrl: 'http://sp2013lysov/sites/slavyanka/Shared%20Documents/createTest.html', controller: 'TestCtrl' }).
				   when('/answerTest', { templateUrl: 'http://sp2013lysov/sites/slavyanka/Shared%20Documents/answer.html', controller: 'TestingCtrl'}).
				   otherwise({ redirectTo: '/' });

});

quizeApp.controller('TestingCtrl', function($scope, $http) {
	$scope.testId = 33;
	$scope.activeQuestion = 0;
	$scope.questions = [];	

	//Define the http headers
	$http.defaults.headers.common.Accept = "application/json;odata=verbose";
	$http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
	$http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
	$http.defaults.headers.post['If-Match'] = "*";
	$http.defaults.headers.common["X-RequestDigest"] = document.getElementById("__REQUESTDIGEST").value;
	
	$scope.nextQuestion = function nextQuestion(argument) {
		if($scope.activeQuestion < $scope.questions.length - 1)
		{
			$scope.activeQuestion++;
		}
	}
	
	$scope.prevQuestion = function prevQuestion(argument){
		if($scope.activeQuestion > 0)
		{
			$scope.activeQuestion--;
		}
	}

	$scope.fillQuestions = function fillQuestions()
	{
		$http({
			method: 'GET',
			url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Questions" + $scope.testId + "')/items?$select=Title,TstApp_Question,TstApp_RightAnswer,TstApp_Var1,TstApp_Var2,TstApp_Var3,TstApp_Var4,TstApp_Var5,TstApp_Var6,TstApp_Var7,TstApp_VarCount",
			headers: {"Accept": "application/json;odata=verbose"}
		})
		.success(function(data, status, headers, config){
			data.d.results.forEach(function(entity){
				var question = {};
				question.question = entity.TstApp_Question;
				question.rightAnswer = entity.TstApp_RightAnswer;				
				question.variants = [];				

				for(var i=1; i <= entity.TstApp_VarCount; i++)
				{
					question.variants.push({ variant: entity["TstApp_Var" + i], checked: false });
				}

				$scope.questions.push(question);
			});			
		})
		.error(function(data, status, headers, config){

		});
	}

	$scope.saveAnswer = function(){
		$http.defaults.headers.post['X-HTTP-Method'] = "";

		var answers = { 
			'__metadata': { 'type': 'SP.Data.Answers' + $scope.testId  + 'ListItem' }, 
			'Title': $scope.testId.toString(),
			'TstApp_RespondentId': _spPageContextInfo.userId.toString()
		}	

		angular.forEach($scope.questions, function(question, key){ 

			var answer = "";
			angular.forEach(question.variants, function(variant, key){
				if(variant.checked){ 
					answer += (key + 1) + ";"
				}
			});
			answers['TstApp_Question_' + (key + 1)] = answer;
		})

		$http.post(
			_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Answers" + $scope.testId + "')/items", answers
		)		
		.success(function(data, status, headers, config){			
			console.log("Answer Added");
		})
		.error(function(data, status, headers, config){
			console.log("Answer Adding Error")
		});
	}

	$scope.fillQuestions();
});

quizeApp.controller('TestCtrl', function($scope, $http, $q){
	$scope.name = "";
	$scope.id = "";
	$scope.questionListId = "";
	$scope.questions = [];
	$scope.addingQuestion = {
		variants : [],
		title : "",
		addingVariant : "",
		rightAnswer: ""
	}
	$scope.testId;

	$scope.addQuestion = function(){
		$scope.questions.push($scope.addingQuestion);
		$scope.addingQuestion =  {
			variants : [],
			title : "",
			addingVariant : "",
			rightAnswer: ""
		};
	}

	$scope.addVariant = function(){
		$scope.addingQuestion.variants.push($scope.addingQuestion.addingVariant);
		$scope.addingQuestion.addingVariant = "";
	}

	//Define the http headers
	$http.defaults.headers.common.Accept = "application/json;odata=verbose";
	$http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
	$http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
	$http.defaults.headers.post['If-Match'] = "*";
	$http.defaults.headers.common["X-RequestDigest"] = document.getElementById("__REQUESTDIGEST").value;

	$scope.saveTest = function(){
		$http.defaults.headers.post['X-HTTP-Method'] = "";

		$http.post(
			_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Tests')/items", 
			{ 
				'__metadata': { 'type': 'SP.Data.TestsListItem' }, 
				'Title': $scope.name 
			})		
		.success(function(data, status, headers, config){			
			console.log("Test Added");
			$scope.testId = data.d.Id;
			$scope.createQuestionsList($scope.testId)
			.then(function(){ return $scope.createAnswersList($scope.testId);})
			.then(function(){ return $scope.addQuestionsToList($scope.testId);});
		})
		.error(function(data, status, headers, config){
			console.log("Test Adding Error")
		});
	}

	$scope.createQuestionsList = function(testId){
		var deferred = $q.defer();
		var title = "Questions" + testId;

		$http.defaults.headers.post['X-HTTP-Method'] = "";
		$http.post(
			_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists", 
			{
				'__metadata': { 'type': 'SP.List' }, 
				'AllowContentTypes': true,
				'BaseTemplate': 100, 
				'ContentTypesEnabled': true, 
				'Description': title, 
				'Title': title
			})		
		.success(function(data, status, headers, config){
			$scope.questionListId = data.d.Id;
			console.log("Questions List Added");
			$scope.addHtmlTextField(title, "TstApp_Question")
			.then(function(){ return $scope.addTextField(title, "TstApp_RightAnswer");})
			.then(function(){ return $scope.addChoiceField(title, "TstApp_Type");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var1");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var2");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var3");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var4");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var5");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var6");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var7");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var8");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var9");})
			.then(function(){ return $scope.addHtmlTextField(title, "TstApp_Var10");})
			.then(function(){ return $scope.addNumberField(title, "TstApp_VarCount");})
			.then(function(){ 
				console.log("Questions Field Added"); 
				deferred.resolve("List Questions Created")
			});
		})
		.error(function(data, status, headers, config){
			console.log("Questions List Adding Error");
			deferred.reject("Questions List Adding Error");
		});
		return deferred.promise;
	}

	$scope.addQuestionsToList = function(){
		console.log("adding questions");
		var promise;

		angular.forEach($scope.questions, function(item) {
			if (!promise) {
				promise = $scope.addQuestionToList(item);
			} else {
				promise = promise.then(function() {
					return $scope.addQuestionToList(item);
				});
			}
		});
	}

	$scope.addQuestionToList = function(question){
		$http.defaults.headers.post['X-HTTP-Method'] = "";

		var postObj = { 
			'__metadata': { 'type': 'SP.Data.Questions' + $scope.testId + 'ListItem' }, 
			'Title': question.title,
			'TstApp_Question': question.title,
			'TstApp_RightAnswer': question.rightAnswer
		}

		if(question.variants)
		{
			postObj['TstApp_VarCount'] = question.variants.length;
			for (var i = 0; i < question.variants.length; i++) {
				postObj['TstApp_Var' + (i + 1)] = question.variants[i]
			};
		}

		var deferred = $q.defer();

		$http.post(
		_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Questions" + $scope.testId + "')/items", postObj)
		.success(function(data, status, headers, config){
			var questionId = data.d.Id;
			$scope.addTextField("Answers" + $scope.testId, "TstApp_Question_" + questionId).then(function(){deferred.resolve();});
			console.log("Question added");			
		})
		.error(function(data, status, headers, config){
			console.log("Adding question error")
		});

		return deferred.promise;
	}

	$scope.addHtmlTextField = function(listName, fieldName){		
		var schemaXml = '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="Note" RichText="TRUE" RichTextMode="FullHtml" />';
		return $scope.addField(listName, schemaXml, fieldName);
	}

	$scope.addNumberField = function(listName, fieldName){		
		var schemaXml = '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="Number" />';
		return $scope.addField(listName, schemaXml, fieldName);
	}

	$scope.addTextField = function(listName, fieldName){
		var schemaXml = '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="Text" />';
		return $scope.addField(listName, schemaXml, fieldName);
	}
	
	$scope.addChoiceField = function(listName, fieldName){		
		var schemaXml = '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="Choice" Format="Dropdown" BaseType="Text" FillInChoice="FALSE"><CHOICES><CHOICE>CheckBox</CHOICE><CHOICE>RadioButton</CHOICE></CHOICES></Field>';
		return $scope.addField(listName, schemaXml, fieldName);
	}

	$scope.addQuestionLookupField = function(listName, fieldName){		
		var schemaXml = '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="Lookup" ShowField="Title" List="' + $scope.questionListId + '" />';
		return $scope.addField(listName, schemaXml, fieldName);
	}

	$scope.addRespondentField = function(listName, fieldName){		
		var schemaXml = '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="User" UserSelectionMode="PeopleOnly" />';
		return $scope.addField(listName, schemaXml, fieldName);
	}

	$scope.addField = function(listName, schemaXml, fieldName){		
		$http.defaults.headers.post['X-HTTP-Method'] = "";
		return $http.post(
			_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('" + listName + "')/fields/createfieldasxml", 
			{
				'parameters': { 
								'__metadata': { 
									'type': 'SP.XmlSchemaFieldCreationInformation' 
								},
								'SchemaXml': schemaXml
							}
			}
		)		
		.success(function(data, status, headers, config){
			console.log("Field: " + fieldName + " Added to List: " + listName);			
		})
		.error(function(data, status, headers, config){
			console.log("Field " + fieldName + " Adding Error in List: " + listName);			
		});	
	}

	$scope.createAnswersList = function(testId){
		var deferred = $q.defer();
		var title = "Answers" + testId;
		$http.defaults.headers.post['X-HTTP-Method'] = "";

		$http.post(
			_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists", 
			{
				'__metadata': { 'type': 'SP.List' }, 
				'AllowContentTypes': true,
				'BaseTemplate': 100, 
				'ContentTypesEnabled': true, 
				'Description': title, 
				'Title': title
			})		
		.success(function(data, status, headers, config){
			console.log("Answers List Added");
			$scope.addRespondentField(title, "TstApp_Respondent")
			//.then(function(){ return $scope.addQuestionLookupField(title, "TstApp_LookupQuestion"); })
			.then(function(){ 
				console.log("Answers Fields Added"); 
				deferred.resolve("Answers Fields Added")
			});
		})
		.error(function(data, status, headers, config){
			console.log("Answers List Adding Error");
			deferred.reject("Answers List Adding Error");
		});	

		return deferred.promise;
	}






	$scope.test = function(){
		var testId = 9;
		var title = "Answers" + testId;
		$scope.addQuestionLookupField(title, "TstApp_LookupQuestion");
	}
});

quizeApp.controller('TestSetCtrl', function($scope, $http){
	$scope.tests=[];

	//Define the http headers
	$http.defaults.headers.common.Accept = "application/json;odata=verbose";
	$http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
	$http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
	$http.defaults.headers.post['If-Match'] = "*";
	$http.defaults.headers.common["X-RequestDigest"] = document.getElementById("__REQUESTDIGEST").value;

	$scope.fillTests = (function()
	{
		$http({
			method: 'GET',
			url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Tests')/items?$select=Title,Id",
		})
		.success(function(data, status, headers, config){
			data.d.results.forEach(function(entity){
				var test = {};
				test.Id = entity.Id;
				test.Title = entity.Title;
				
				$scope.tests.push(test);
			});			
		})
		.error(function(data, status, headers, config){

		});
	})();

	$scope.deleteTest = function(id, index){ 
		$http.defaults.headers.post['X-HTTP-Method'] = "DELETE";

		$http({ 
			method: 'POST',
			url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Tests')/items(" + id + ")",
		}).success(function(){ 
			console.log("Tests List item deleted: id " + id);
			
			$scope.tests.splice(index, 1);

		}).error(function(){ 
			console.log("ERROR: Tests List item deleted FAIL: id " + id);
		});

		$scope.deleteList("Questions" + id);
		$scope.deleteList("Answers" + id);
	}

	$scope.deleteList = function(title){
		$http({ 
			method: 'POST',
			url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('" + title + "')",
		}).success(function(){ 
			console.log(title + " list deleted");
		}).error(function(){
			console.log("ERROR: " + title + " list deleting");
		});
	}
});