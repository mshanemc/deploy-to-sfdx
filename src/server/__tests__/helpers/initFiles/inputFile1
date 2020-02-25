sfdx force:org:create -f config/project-scratch-def.json -d 1 -s
sfdx force:source:push
sfdx force:user:permset:assign -n Courses
sfdx force:data:bulk:upsert -s course__c -f data/courses.csv -i Id
sfdx force:org:open -p /lightning/o/Course__c/list?filterName=All_Courses
sfdx force:data:record:create -s CollaborationGroup -v "Name='Professional Translators' CollaborationType=Public Description='We translate anything you pay us to.  Any language, we can make it happen.  No fictional languages (Klingon, Pig Latin, Elvish, etc), please.' InformationTitle='How Translation Works' InformationBody='πώς λειτουργεί η μετάφραση'"
sfdx shane:group:photo -f assets/rosetta.jpg -g "Professional Translators"
sfdx shane:group:photo -b assets/rosettabanner.jpg -g "Professional Translators"