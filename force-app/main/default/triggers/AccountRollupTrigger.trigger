trigger AccountRollupTrigger on Contact (after insert, after update, after delete) {
    Set<Id> accountIds = new Set<Id>();

    // Collect Account IDs from the Contact records
    if (Trigger.isInsert || Trigger.isUpdate) {
        for (Contact c : Trigger.new) {
            if (c.AccountId != null) {
                accountIds.add(c.AccountId);
            }
        }
    }
    if (Trigger.isDelete) {
        for (Contact c : Trigger.old) {
            if (c.AccountId != null) {
                accountIds.add(c.AccountId);
            }
        }
    }

    // Perform the custom rollup
    List<Account> accountsToUpdate = new List<Account>();
    for (Account acc : [SELECT Id, (SELECT Id FROM Contacts) FROM Account WHERE Id IN :accountIds]) {
        acc.Number_of_Contacts__c = acc.Contacts.size();  // Example rollup: count of related contacts
        accountsToUpdate.add(acc);
    }

    if (accountsToUpdate.size() > 0) {
        update accountsToUpdate;
    }
}