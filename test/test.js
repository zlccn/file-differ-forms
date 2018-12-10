var path = require('path');
var fileDifferForms = require('../index');

describe('file-differ-forms', function () {

    it('Extract file directory', function (done) {

        fileDifferForms({
            main:'zh.json',
            appsrc:path.join(__dirname,'./files_GoalOne/'),
            pcssrc:path.join(__dirname,'./files_GoalTwo/'),
            xlsdir:path.join(__dirname,'./dist/')
        })

        done();

    })

})
