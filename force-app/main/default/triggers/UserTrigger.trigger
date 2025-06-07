trigger UserTrigger on User (after insert) {

    //Typically these would be set in a constant class
    String internalBusinessName = 'Internal_Business';
    String consultantPermissionName = 'Consultant_Permissions';

    //Store permission set Ids
    Id internalBusinessPermissionId;
    Id consultantPermissionId;

    for(PermissionSet permission: [SELECT Id, Name FROM PermissionSet WHERE Name =: internalBusinessName OR Name =: consultantPermissionName]){

        if(permission.name ==  internalBusinessName){
            internalBusinessPermissionId = permission.Id;
        }else if(permission.name == consultantPermissionName){
            consultantPermissionId = permission.Id;
        }
    }


    //Here we will create a list of permission assignments for the user records
    List<PermissionSetAssignment> permissionSetAssignments = new List<PermissionSetAssignment>();

    for(User userRecord: trigger.new){
        PermissionSetAssignment permissionSetAssignment = new PermissionSetAssignment();

        //Check if the user is a consultant
        if(userRecord.Username.endsWith('.consultant')){
            //Set permission id to consultant permission set id
            permissionSetAssignment.PermissionSetId = consultantPermissionId;

        }else{
            //We are dealing with an internal business user
            permissionSetAssignment.PermissionSetId = internalBusinessPermissionId;
        }
        //Assign permission set to user
        permissionSetAssignment.AssigneeId = userRecord.Id;

        permissionSetAssignments.add(permissionSetAssignment);
    }

    insert permissionSetAssignments;
}